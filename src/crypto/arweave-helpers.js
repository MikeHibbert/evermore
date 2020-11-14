const Arweave = require('arweave/node');
const fs = require('fs');
const fse = require('fs-extra');
const crypto = require('crypto');
const axios = require('axios')
const path = require('path');
const notifier = require('node-notifier');
const mime = require('mime-types');
import { https } from 'follow-redirects';
import { readContract, selectWeightedPstHolder  } from 'smartweave';
import { settings } from '../config';
import regeneratorRuntime from "regenerator-runtime";
import {
    walletFileSet, 
    UpdatePendingFileTransactionID, 
    SaveUploader, 
    RemoveUploader,
    RemovePendingFile,
    GetSyncedFolders,
    GetDeletedFiles, 
    GetSyncedFileBy,
    RemoveFileFromDownloads,
    AddSyncedFileFromTransaction
} from '../db/helpers';

import {
    createCRCFor,
    systemHasEnoughDiskSpace,
} from '../fsHandling/helpers';


import {
    encryptFile,
    decryptFile,
    encryptDataWithRSAKey,
    getFileEncryptionKey
} from './files';

export const arweave = Arweave.init(settings.ARWEAVE_CONFIG);

export const getJwkFromWalletFile = (file_path) => {
    const rawdata = fs.readFileSync(file_path);
    const jwk = JSON.parse(rawdata);

    return jwk;
}

export const getWalletBalance = async (file_path) => {
    const jwk = getJwkFromWalletFile(file_path);

    try {
        return arweave.wallets.jwkToAddress(jwk).then((address) => {
            return arweave.wallets.getBalance(address).then((balance) => {
                return arweave.ar.winstonToAr(balance);
            })
        });
    } catch(e) {
        console.log(e);
        return 0;
    }
    
}

export const getWalletAddress = async (file_path) => {
    const jwk = getJwkFromWalletFile(file_path);

    return arweave.wallets.jwkToAddress(jwk).then((address) => {
        return address;
    });
}

export const uploadFile = async (file_info, encrypt_file) => {
    const wallet_file = walletFileSet();

    if(!wallet_file || wallet_file.length == 0) return;

    const wallet_jwk = getJwkFromWalletFile(wallet_file);
    
    let stats = fs.statSync(file_info.path);
    let required_space = Math.ceil(stats['size'] * 1.5);
    let processed_file_path = file_info.path;

    if(encrypt_file) {
        required_space = Math.ceil(stats['size'] * 2.5); // abitrary idea that encryption will probably create a larger file than the source.
    }

    if(!systemHasEnoughDiskSpace(required_space)) {
        notifier.notify({
            title: 'Evermore Datastore',
            icon: settings.NOTIFY_ICON_PATH,
            message: `Not enough disk space to upload - ${required_space} bytes required`,
            timeout: 2
        });

        return;
    }

    let encrypted_result = null;

    if(encrypt_file) {
        const jwk = await arweave.wallets.generate();
        processed_file_path = `${file_info.path}.enc`;

        encrypted_result = await encryptFile(wallet_jwk, jwk, file_info.path, processed_file_path); 
        stats = fs.statSync(processed_file_path);       
    }    
    
    fs.access(processed_file_path, fs.constants.F_OK | fs.constants.R_OK, async (err) => {
        if(err) {
            RemovePendingFile(file_info.path);
        } else {

            const file_data = await getFileData(processed_file_path);             
            
            try {
                const crc_for_data = await createCRCFor(file_info.path);

                const transaction = await arweave.createTransaction({
                    data: file_data
                }, wallet_jwk);

                const wallet_balance = await getWalletBalance(wallet_file);
                const data_cost = await arweave.transactions.getPrice(stats['size']);

                const total_winston_cost = parseInt(transaction.reward) + parseInt(data_cost);
                const total_ar_cost = arweave.ar.winstonToAr(total_winston_cost);
                
                if(wallet_balance < total_ar_cost) {
                    notifier.notify({
                        title: 'Evermore Datastore',
                        icon: settings.NOTIFY_ICON_PATH,
                        message: `Your wallet does not contain enough AR to upload, ${total_ar_cost} AR is needed `,
                        timeout: 2
                    });
            
                    return;
                }

                transaction.addTag('App-Name', settings.APP_NAME);
                transaction.addTag('Content-Type', mime.lookup(file_info.file));
                transaction.addTag('file', file_info.file.replace(/([^:])(\/\/+)/g, '$1/'));
                transaction.addTag('path', file_info.path.replace(/([^:])(\/\/+)/g, '$1/'));
                transaction.addTag('modified', file_info.modified);
                transaction.addTag('hostname', file_info.hostname);
                transaction.addTag('version', file_info.version);
                transaction.addTag('CRC', crc_for_data);
                transaction.addTag('file_size', stats["size"]);

                if(encrypt_file) {
                    transaction.addTag('key_size', encrypted_result.key_size);
                    transaction.addTag('domain', 'Private');
                } else {
                    transaction.addTag('key_size', -1);
                    transaction.addTag('domain', 'Public');
                }

                await arweave.transactions.sign(transaction, wallet_jwk);

                UpdatePendingFileTransactionID(file_info.file, transaction.id);

                let uploader = await arweave.transactions.getUploader(transaction);

                const uploader_record = SaveUploader(uploader);

                while (!uploader.isComplete) {
                    await uploader.uploadChunk();
                    console.log(`${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`);
                }

                sendUsagePayment(data_cost);

                RemoveUploader(uploader_record);

                if(encrypt_file) {
                    if(fs.existsSync(processed_file_path)) { 
                        fs.unlink(processed_file_path, (err) => {});
                    }
                }

                console.log(`${file_info.path} uploaded`);
            } catch (e) {
                
                console.log(e);
            }
        }        
    }); // for whatever reason this file is now gone!
}

export const getFileData = (file_path) => {
    const data = fs.readFileSync(file_path);

    return data;
}

export const sendUsagePayment = async (transaction_cost) => {
    const wallet_file = walletFileSet();

    if(!wallet_file || wallet_file.length == 0) return;

    const jwk = getJwkFromWalletFile(wallet_file);

    const contractState = await readContract(arweave, settings.CONTRACT_ADDRESS);

    const holder = selectWeightedPstHolder(contractState.balances)
    
    // send a fee. You should inform the user about this fee and amount.

    const tx = await arweave.createTransaction({ 
            target: holder, 
            quantity: calculatePSTPayment(transaction_cost, settings.USAGE_PERCENTAGE)}
            , jwk);
            
    await arweave.transactions.sign(tx, jwk);
    await arweave.transactions.post(tx);
    
    return tx;
}

export const calculatePSTPayment = (transaction_cost, percentage) => {
    return Math.ceil(transaction_cost * percentage);
}

export const setFileStatusAsDeleted = async (file_info) => {
    const wallet_file = walletFileSet();

    if(!wallet_file || wallet_file.length == 0) return;

    const wallet_jwk = getJwkFromWalletFile(wallet_file);

    const transaction = await arweave.createTransaction({}, wallet_jwk);

    const wallet_balance = await getWalletBalance();

    const total_winston_cost = parseInt(transaction.reward);
    const total_ar_cost = arweave.ar.arToWinston(total_winston_cost);
    
    if(wallet_balance < total_ar_cost) {
        notifier.notify({
            title: 'Evermore Datastore',
            icon: settings.NOTIFY_ICON_PATH,
            message: `Your wallet does not contain enough AR to upload, ${total_ar_cost} AR is needed `,
            timeout: 2
        });

        return;
    }

    transaction.addTag('App-Name', settings.APP_NAME);
    transaction.addTag('file', file_info.file.replace(/([^:])(\/\/+)/g, '$1/'));
    transaction.addTag('path', file_info.path.replace(/([^:])(\/\/+)/g, '$1/'));
    transaction.addTag('modified', file_info.modified);
    transaction.addTag('hostname', file_info.hostname);
    transaction.addTag('version', file_info.version);
    transaction.addTag('STATUS', "DELETED");
    transaction.addTag('ACTION_TIMESTAMP', new Date().getTime());

    await arweave.transactions.sign(transaction, wallet_jwk);

    const response = await arweave.transactions.post(transaction);

    if(response.status != 200) {
        let error_msg = null;

        if(response.status == 400) {
            error_msg = "The transaction was rejected as invalid.";
        }

        if(response.status == 500) {
            error_msg = "There was an error connecting to the blockchain.";
        }

        notifier.notify({
            title: 'Evermore Datastore',
            icon: settings.NOTIFY_ICON_PATH,
            message: `There was an error updating the status of ${file_info.name} - ${error_msg}`,
            timeout: 2
        });

        return;
    }
}

export const getDownloadableFiles = async () => {
    const wallet_file = walletFileSet();

    if(!wallet_file || wallet_file.length == 0) return [];

    const jwk = getJwkFromWalletFile(wallet_file);

    const windows = settings.PLATFORM === "win32";

    const address = await arweave.wallets.jwkToAddress(jwk);

    const tx_ids = await arweave.arql({
        op: "and",
        expr1: {
            op: "equals",
            expr1: "from",
            expr2: address
        },
        expr2: {
            op: "equals",
            expr1: "App-Name",
            expr2: settings.APP_NAME
        }
    });

    const tx_rows = await Promise.all(tx_ids.map(async (tx_id) => {
    
        let tx_row = {id: tx_id};
        
        var tx = await arweave.transactions.get(tx_id);
        
        tx.get('tags').forEach(tag => {
            let key = tag.get('name', { decode: true, string: true });
            let value = tag.get('value', { decode: true, string: true });
            
            if(key == "modified" || key == "version") {
                tx_row[key] = parseInt(value);
            } else {
                tx_row[key] = value;
            }
            
        });  
        
        if(!tx_row.hasOwnProperty('file')) {
            tx_row['file'] = tx_row['path'];
        }

        return tx_row
    }));

    // remove old duplicates
    const final_rows = [];
    for(let i in tx_rows) {
        const row = tx_rows[i];

        let found = false;
        for(let j in final_rows) {
            const final_row = final_rows[j];

            if(final_row.path == row.path && row.modified > final_row.modified) {
                found = true;
                final_rows[j] = row;
            }
        }

        if(!found) {
            final_rows.push(row);
        }
    }

    return final_rows;
}

export const getDownloadableFilesGQL = async () => {
    const wallet_file = walletFileSet();

    if(!wallet_file || wallet_file.length == 0) return [];

    const jwk = getJwkFromWalletFile(wallet_file);

    const windows = settings.PLATFORM === "win32";

    const address = await arweave.wallets.jwkToAddress(jwk);

    const query = `{
        transactions(
            owners: ["${address}"],
              tags: [
              {
                  name: "App-Name",
                  values: ["${settings.APP_NAME}"]
              },
              ]	) {
              edges {
                  node {
                    id
                    tags {
                        name
                        value
                    }
                  }
              }
          }
    }`;

    const response = await axios.post(settings.GRAPHQL_ENDPOINT, {
        operationName: null,
        query: query,
        variables: {}
    });

    if(response.status == 200) {
        const available_rows = [];

        for(let i in response.data.data.transactions.edges) {
            const row = response.data.data.transactions.edges[i].node;

            row['action'] = 'download';

            for(let i in row.tags) {
                const tag = row.tags[i];

                if(tag.name == 'version' || tag.name == 'modified') {
                    row[tag.name] = parseInt(tag.value);
                } else {
                    row[tag.name] = tag.value;
                }
            }

            let found = false;
            for(let j in available_rows) {
                const final_row = available_rows[j];

                if(final_row.path == row.path && row.modified > final_row.modified) {
                    found = true;
                    available_rows[j] = row;
                }
            }

            if(!found) {
                available_rows.push(row);
            }
        }

        const final_rows = [];

        const persistence_records = await getPersistenceRecords();
        const deleted_files = GetDeletedFiles();

        available_rows.forEach(available_row => {
            available_row['action'] = 'download';

            const synced_file = GetSyncedFileBy({file: available_row.file});
            if(synced_file) {
                if(available_row.modified > parseInt(synced_file.modified)) {
                    if(available_row.CRC != synced_file.CRC) {
                        const deleted_matches = deleted_files.filter(df => df.action_tx_id == available_row.id);
                        const persistence_matches = persistence_records.filter(pr => pr.id == available_row.id);

                        let current_persistence_state = 'available';

                        persistence_matches.forEach(pm => {
                            if(pm.action == 'delete') {
                                current_persistence_state = 'deleted';
                            } else {
                                current_persistence_state = 'available';
                            }
                        });

                        if(deleted_matches.length == 0 && current_persistence_state == 'available') {
                            final_rows.push(available_row);
                        }                        
                    } 
                }
            } else {
                const deleted_matches = deleted_files.filter(df => df.action_tx_id == available_row.id);
                const persistence_matches = persistence_records.filter(pr => pr.id == available_row.id);

                let current_persistence_state = 'available';

                persistence_matches.forEach(pm => {
                    if(pm.action == 'delete') {
                        current_persistence_state = 'deleted';
                    } else {
                        current_persistence_state = 'available';
                    }
                });

                if(deleted_matches.length == 0 && current_persistence_state == 'available') {
                    final_rows.push(available_row);
                }      
            }
            
        });

        return final_rows;
    }
    
    return null; // if nothing is returned 
}

export const finishUpload = async (resumeObject) => {
    const transaction = await arweave.transactions.get(resumeObject.transaction.id).then(async (transaction) => {
        const tx_row = {};
        
        transaction.get('tags').forEach(tag => {
            let key = tag.get('name', { decode: true, string: true });
            let value = tag.get('value', { decode: true, string: true });
            
            if(key == "modified" || key == "version") {
                tx_row[key] = parseInt(value);
            } else {
                tx_row[key] = value;
            }
            
        });  

        let processed_file_path = tx_row.path;
        if(encrypt_file) {
            processed_file_path = `${tx_row.path}.enc`;
        }   

        fs.access(processed_file_path, fs.constants.F_OK | fs.constants.R_OK, async (err) => {
            if(err) {
                RemovePendingFile(file_info.path);
            } else {
                const file_data = await getFileData(processed_file_path);

                let uploader = await arweave.transactions.getUploader(resumeObject, file_data);

                while (!uploader.isComplete) {
                    await uploader.uploadChunk();
                    console.log(`${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`);
                }
            }
        });
    })
    .catch(err => {
        console.log(`finishUpload: ${err}`);
    });    
}

export const getTransactionStatus = async (tx_id) => {
    return await arweave.transactions.getStatus(tx_id);
}

export const confirmTransaction = async (tx_id) => {
    const response = await getTransactionStatus(tx_id);
    console.log(JSON.stringify(status));

    if(response.status == 200) {
        if(response.hasOwnProperty('confirmed')) {
            if(response.confirmed.number_of_confirmations > 4) {
                return true;
            }
        }
    }

    return false;
}

export const getTransactionWithTags = async (tx_id) => {
    const transaction = await arweave.transactions.get(tx_id).then(async (transaction) => {
        const tx_row = {id: transaction.id};
        
        transaction.get('tags').forEach(tag => {
            let key = tag.get('name', { decode: true, string: true });
            let value = tag.get('value', { decode: true, string: true });
            
            if(key == "modified" || key == "version" || key == "file_size") {
                tx_row[key] = parseInt(value);
            } else {
                tx_row[key] = value;
            }
            
        }); 

        return tx_row;
    });

    return transaction;
}

const downloadFile = function(url, dest, cb) {
    var file = fs.createWriteStream(dest);
    var request = https.get(url, function(response) {
        response.pipe(file);
        file.on('finish', function() {
        file.close(cb);  // close() is async, call cb after close completes.
        });
    }).on('error', function(err) { // Handle errors
        fs.unlink(dest); // Delete the file async. (But we don't check the result)
        if (cb) cb(err.message);
    });
};

export const downloadFileFromTransaction = async (tx_id) => {
    const persistence_transaction = await arweave.transactions.get(tx_id).then(async (transaction) => {
        const tx_row = {id: transaction.id, tx_id: transaction.id};
        
        transaction.get('tags').forEach(tag => {
            let key = tag.get('name', { decode: true, string: true });
            let value = tag.get('value', { decode: true, string: true });
            
            if(key == "modified" || key == "version" || key == "file_size") {
                tx_row[key] = parseInt(value);
            } else {
                tx_row[key] = value;
            }
            
        }); 

        return tx_row;
    });

    const transaction = await arweave.transactions.get(persistence_transaction.action_tx_id).then(async (transaction) => {
        const tx_row = {id: transaction.id, tx_id: transaction.id};
        
        transaction.get('tags').forEach(tag => {
            let key = tag.get('name', { decode: true, string: true });
            let value = tag.get('value', { decode: true, string: true });
            
            if(key == "modified" || key == "version" || key == "file_size") {
                tx_row[key] = parseInt(value);
            } else {
                tx_row[key] = value;
            }
            
        }); 

        return tx_row;
    });

    if(!systemHasEnoughDiskSpace(Math.ceil(transaction.file_size * 2))) {
        notifier.notify({
            title: 'Evermore Datastore',
            icon: settings.NOTIFY_ICON_PATH,
            message: `Not enough disk space to download - ${required_space} bytes required`,
            timeout: 2
        });

        return;
    }

    // createTempFolder();


    const sync_folders = GetSyncedFolders();

    const is_encrypted = transaction.path.indexOf('Public\\') == -1;

    if(is_encrypted) {
        const save_file_encrypted = path.join(sync_folders[0], `${transaction.file}.enc`);

        downloadFile(`https://arweave.net/${transaction.id}`, save_file_encrypted, async (err) => {
            if (err) {
                console.error(err);
            }

            const wallet_file = walletFileSet();

            if(!wallet_file || wallet_file.length == 0) {
                notifier.notify({
                    title: 'Evermore Datastore',
                    icon: settings.NOTIFY_ICON_PATH,
                    message: `Unable to download encrypted file ${save_file_encrypted} your wallet file is not set.`,
                    timeout: 2
                });

                fs.unlink(save_file_encrypted, (err) => {});
            }
            const jwk = getJwkFromWalletFile(wallet_file);

            const private_key = await getFileEncryptionKey(save_file_encrypted, transaction, jwk);
            const save_file = path.join(sync_folders[0], `${transaction.file}`);
            const result = await decryptFile(jwk, private_key, parseInt(transaction.key_size), save_file_encrypted, save_file);

            fs.unlink(save_file_encrypted, (err) => {});
        });
    } else {
        const save_file = path.join(sync_folders[0], transaction.file);

        downloadFile(`https://arweave.net/${transaction.id}`, save_file, data, (err) => {
            if (err) {
                console.error(err);
            }
        });
    }

    debugger;

    AddSyncedFileFromTransaction(transaction);

    RemoveFileFromDownloads(transaction.file);

    
    

    // removeTempFolder();
}

export const transactionExistsOnTheBlockchain = async (tx_id) => {
    const response = await arweave.transactions.getStatus(tx_id);

    if(response.status == 200) {
        if(response.hasOwnProperty('confirmed')) {
            if(response.confirmed.number_of_confirmations > 3) {
                return true;
            }
        }
        return false;
    }

    return false;
}

export const fileExistsOnTheBlockchain = async (file_info) => {
    const wallet_file = walletFileSet();

    if(!wallet_file || wallet_file.length == 0) return [];

    const jwk = getJwkFromWalletFile(wallet_file);

    const address = await arweave.wallets.jwkToAddress(jwk);

    const existing = await arweave.arql({
        op: "and",
        expr1: {
            op: "and",
            expr1: {
                op: "equals",
                expr1: "App",
                expr2: settings.APP_NAME
            },
            expr2: {
                op: "equals",
                expr1: "from",
                expr2: address
            }
        },
        expr2: {
            op: "and",
            expr1: {
                op: "equals",
                expr1: "path",
                expr2: file_info.path
            },
            expr2: {
                op: "equals",
                expr1: "modified",
                expr2: file_info.modified.toString()
            }
        }
    });

    return existing;
}

export const getOnlineVersions = async (file_info) => {
    const wallet_file = walletFileSet();

    if(!wallet_file || wallet_file.length == 0) return [];

    const jwk = getJwkFromWalletFile(wallet_file);

    const windows = settings.PLATFORM === "win32";

    const address = await arweave.wallets.jwkToAddress(jwk);

    const query = `{
        transactions(
            owners: ["${address}"],
              tags: [
              {
                  name: "App-Name",
                  values: ["${settings.APP_NAME}"]
              },
              {
                name: "file",
                values: ["${file_info.file}"]
              }
              ]	) {
              edges {
                  node {
                    id
                    tags {
                        name
                        value
                    }
                  }
              }
          }
    }`;

    const response = await axios.post(settings.GRAPHQL_ENDPOINT, {
        operationName: null,
        query: query,
        variables: {}
    });

    if(response.status == 200) {
        const final_rows = [];

        for(let i in response.data.data.transactions.edges) {
            const row = response.data.data.transactions.edges[i].node;

            row['action'] = 'download';

            for(let i in row.tags) {
                const tag = row.tags[i];
                if(tag.name == 'version' || tag.name == 'modified') {
                    row[tag.name] = parseInt(tag.value);
                } else {
                    row[tag.name] = tag.value;
                }
                
            }

            final_rows.push(row);
        }

        return final_rows;
    }
    
    return null; // if nothing is returned 
}

export const createPersistenceRecord = async (synced_file, deleted) => {
    const wallet_file = walletFileSet();

    if(!wallet_file || wallet_file.length == 0) return;

    const wallet_jwk = getJwkFromWalletFile(wallet_file);

    debugger;

    const transaction = await arweave.createTransaction({data:'PERSISTENCE_RECORD'}, wallet_jwk);

    transaction.addTag('App-Name', settings.APP_NAME);
    transaction.addTag('Content-Type', 'PERSISTENCE');
    transaction.addTag('file', synced_file.file.replace(/([^:])(\/\/+)/g, '$1/'));
    transaction.addTag('path', synced_file.path.replace(/([^:])(\/\/+)/g, '$1/'));
    transaction.addTag('modified', synced_file.modified);
    transaction.addTag('hostname', synced_file.hostname);
    transaction.addTag('version', synced_file.version);
    transaction.addTag('action_tx_id', synced_file.action_tx_id);
    
    if(deleted) {
        transaction.addTag('action', "DELETE");
    } else {
        transaction.addTag('action', "UNDELETE");
    }

    await arweave.transactions.sign(transaction, wallet_jwk);

    const response = await arweave.transactions.post(transaction);

    if(response.status == 200) {
        return transaction.id;
    }
    
    return null;
} 

export const getPersistenceRecords = async () => {
    const wallet_file = walletFileSet();

    if(!wallet_file || wallet_file.length == 0) return [];

    const jwk = getJwkFromWalletFile(wallet_file);

    const address = await arweave.wallets.jwkToAddress(jwk);

    const query = `{
        transactions(
            owners: ["${address}"],
              tags: [
              {
                  name: "App-Name",
                  values: ["${settings.APP_NAME}"]
              },
              {
                name: "Content-Type",
                values: ["PERSISTENCE"]
              }
              ]	) {
              edges {
                  node {
                    id
                    tags {
                        name
                        value
                    }
                  }
              }
          }
    }`;

    const response = await axios.post(settings.GRAPHQL_ENDPOINT, {
        operationName: null,
        query: query,
        variables: {}
    });

    if(response.status == 200) {
        const final_rows = [];

        for(let i in response.data.data.transactions.edges) {
            const row = response.data.data.transactions.edges[i].node;

            

            for(let i in row.tags) {
                const tag = row.tags[i];
                if(tag.name == 'version' || tag.name == 'modified') {
                    row[tag.name] = parseInt(tag.value);
                } else {
                    row[tag.name] = tag.value;
                }
                if(tag.name == 'action') {
                    row['action'] = tag.value == 'DELETE' ? 'delete' : 'download';
                }
            }

            final_rows.push(row);
        }

        return final_rows;
    }
}

export const getPersistenceRecordsFor = async (file_path) => {
    const wallet_file = walletFileSet();

    if(!wallet_file || wallet_file.length == 0) return [];

    const jwk = getJwkFromWalletFile(wallet_file);

    const address = await arweave.wallets.jwkToAddress(jwk);

    const query = `{
        transactions(
            owners: ["${address}"],
              tags: [
              {
                  name: "App-Name",
                  values: ["${settings.APP_NAME}"]
              },
              {
                name: "Content-Type",
                values: ["PERSISTENCE"]
              },
              {
                  name: "file".
                  values: ["${file_path}"]
              }
              ]	) {
              edges {
                  node {
                    id
                    tags {
                        name
                        value
                    }
                  }
              }
          }
    }`;

    const response = await axios.post(settings.GRAPHQL_ENDPOINT, {
        operationName: null,
        query: query,
        variables: {}
    });

    if(response.status == 200) {
        const final_rows = [];

        for(let i in response.data.data.transactions.edges) {
            const row = response.data.data.transactions.edges[i].node;

            

            for(let i in row.tags) {
                const tag = row.tags[i];
                if(tag.name == 'version' || tag.name == 'modified') {
                    row[tag.name] = parseInt(tag.value);
                } else {
                    row[tag.name] = tag.value;
                }
                if(tag.name == 'action') {
                    row['action'] = tag.value == 'DELETE' ? 'delete' : 'download';
                }
            }

            final_rows.push(row);
        }

        return final_rows;
    }
}
