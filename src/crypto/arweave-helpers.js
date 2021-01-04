const Arweave = require('arweave/node');
const fs = require('fs');
const dns = require('dns');
const fse = require('fs-extra');
const crypto = require('crypto');
const axios = require('axios')
const path = require('path');
const notifier = require('node-notifier');
const mime = require('mime-types');
import { https } from 'follow-redirects';
import { readContract, selectWeightedPstHolder  } from 'smartweave';
import { settings } from '../config';
import {showNotification} from '../ui/notifications';
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
    AddSyncedFileFromTransaction,
    RemoveProposedFileBy
} from '../db/helpers';
import {
    createCRCFor,
    normalizePath,
    denormalizePath,
    systemHasEnoughDiskSpace,
} from '../fsHandling/helpers';
import {
    encryptFile,
    decryptFile,
    encryptDataWithRSAKey,
    getFileEncryptionKey
} from './files';
import { utimes } from 'utimes';
import { updateFileMonitoringStatuses } from '../qt-system-tray';
import { GetPendingFile } from '../../dist/db/helpers';
const Sentry = require("@sentry/node");

export const arweave = Arweave.init(settings.ARWEAVE_CONFIG);

export const getJwkFromWalletFile = (file_path) => {
    const rawdata = fs.readFileSync(file_path);
    const jwk = JSON.parse(rawdata);

    return jwk;
}

export const checkInternet = (cb) => {
    require('dns').lookup('google.com',function(err) {
        if (err && err.code == "ENOTFOUND") {
            cb(false);
        } else {
            cb(true);
        }
    })
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
        Sentry.captureException(e);
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
    
    const denormalize_path = denormalizePath(file_info.path);
    let stats = fs.statSync(denormalize_path);
    let required_space = Math.ceil(stats['size'] * 1.5);
    
    let processed_file_path = denormalize_path;
    const path_parts = file_info.path.split('/');
    const filename = path_parts[path_parts.length - 1];

    if(encrypt_file) {
        required_space = Math.ceil(stats['size'] * 2.5); // abitrary idea that encryption will probably create a larger file than the source.
    }

    if(!systemHasEnoughDiskSpace(required_space)) {
        showNotification(`Not enough disk space to upload - ${required_space} bytes required`);

        return;
    }

    let encrypted_result = null;

    if(encrypt_file) {
        const jwk = await arweave.wallets.generate();
        processed_file_path = `${processed_file_path}.enc`;

        encrypted_result = await encryptFile(wallet_jwk, jwk, denormalize_path, processed_file_path); 
        stats = fs.statSync(processed_file_path);       
    }    
    
    
    const file_data = await getFileData(processed_file_path);             
    
    try {
        const crc_for_data = await createCRCFor(denormalize_path);

        const transaction = await arweave.createTransaction({
            data: file_data
        }, wallet_jwk);

        const wallet_balance = await getWalletBalance(wallet_file);
        const data_cost = await arweave.transactions.getPrice(stats['size']);

        const total_winston_cost = parseInt(transaction.reward) + parseInt(data_cost);
        const total_ar_cost = arweave.ar.winstonToAr(total_winston_cost);
        
        if(wallet_balance < total_ar_cost) {
            showNotification(`Your wallet does not contain enough AR to upload, ${total_ar_cost} AR is needed `)
    
            return;
        }

        transaction.addTag('App-Name', settings.APP_NAME);
        transaction.addTag('Content-Type', mime.lookup(file_info.file));
        transaction.addTag('filename', filename);
        transaction.addTag('file', file_info.file);
        transaction.addTag('path', file_info.path);
        transaction.addTag('modified', file_info.modified);
        transaction.addTag('hostname', file_info.hostname);

        const created = new Date(stats['birthtime']).getTime();
        transaction.addTag('created', created);
        transaction.addTag('version', file_info.version);
        transaction.addTag('CRC', crc_for_data);
        transaction.addTag('file_size', stats["size"]);

        if(encrypt_file) {
            transaction.addTag('key_size', encrypted_result.key_size);
            transaction.addTag('domain', 'Private');
        } else {
            transaction.addTag('domain', 'Public');
        }

        await arweave.transactions.sign(transaction, wallet_jwk);

        UpdatePendingFileTransactionID(file_info.path, transaction.id);

        let uploader = await arweave.transactions.getUploader(transaction);

        //const uploader_record = SaveUploader(uploader);

        while (!uploader.isComplete) {
            await uploader.uploadChunk();
            console.log(`${file_info.path} : ${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`);
        }

        sendUsagePayment(data_cost);

        //RemoveUploader(uploader_record);

        if(encrypt_file) {
            const now = new Date().getTime();

            if(fs.existsSync(processed_file_path))
                fs.renameSync(processed_file_path, `${now}.del`);  // It's not going to affect the current open handles
            if(fs.existsSync(`${now}.del`))
                fs.unlinkSync(`${now}.del`);
        }

        updateFileMonitoringStatuses();

        console.log(`${file_info.path} uploaded`);
    } catch (e) {
        console.log(e);
    }   
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
        showNotification(`Your wallet does not contain enough AR to upload, ${total_ar_cost} AR is needed `);

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

        showNotification(`There was an error updating the status of ${file_info.name} - ${error_msg}`);

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

    const address = await arweave.wallets.jwkToAddress(jwk);

    let cursor = '';
    let hasNextPage = true;
    const transactions = {};

    while(hasNextPage) {
        const query = `{
            transactions(
                owners: ["${address}"],
                tags: [
                {
                    name: "App-Name",
                    values: ["${settings.APP_NAME}"]
                },
                ]
                after: "${cursor}"
                first: 100	) {
                pageInfo {
                    hasNextPage
                }
                edges {
                    cursor
                    node {
                        id
                        tags {
                            name
                            value
                        }
                        block {
                            timestamp
                            height
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
            const data = response.data.data;

            for(let i in data.transactions.edges) {
                const row = data.transactions.edges[i].node;

                row['action'] = 'download';
                row['tx_id'] = row.id;

                for(let i in row.tags) {
                    const tag = row.tags[i];

                    if(tag.name == 'version' || tag.name == 'modified' || tag.name == 'created') {
                        row[tag.name] = parseInt(tag.value);
                    } else {
                        row[tag.name] = tag.value;
                    }
                }

                if(transactions.hasOwnProperty(row['file'])) {
                    const existing_tx = transactions[row['file']];
                    if(existing_tx.modified < row.modified && row['Content-Type'] != 'PERSISTENCE') {
                        transactions[row['file']] = row;
                    }
                } else {
                    if(row['Content-Type'] != 'PERSISTENCE') {
                        transactions[row['file']] = row;
                    }
                }
            }

            hasNextPage = data.transactions.pageInfo.hasNextPage;

            if(hasNextPage) {
                cursor = data.transactions.edges[data.data.transactions.edges.length - 1].cursor;
            }
        } else {
            hasNextPage = false;
        }
    }

    const final_rows = [];

    const persistence_records = await getPersistenceRecords();
    const deleted_files = GetDeletedFiles();

    Object.keys(transactions).forEach(file_name => {
        const available_row = transactions[file_name];
        available_row['action'] = 'download';

        const synced_file = GetSyncedFileBy({file: available_row.file});
        if(synced_file) {
            if(available_row.modified > parseInt(synced_file.modified)) {
                // if(available_row.CRC != synced_file.CRC) {
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
                // } 
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

    return final_rows == [] ? null : final_rows;
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

                const now = new Date().getTime();

                if(encrypt_file) {
                    if(fs.existsSync(processed_file_path))
                        fs.renameSync(processed_file_path, `${now}.del`);  // It's not going to affect the current open handles
                    if(fs.existsSync(`${now}.del`))
                        fs.unlinkSync(`${now}.del`);
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
    try {
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
    } catch(e) {
        return null;
    }    
}

export const downloadFile = function(url, dest, cb) {
    var file = fs.createWriteStream(dest, {emitClose : true, encoding: 'binary'});
    var request = https.get(url, function(response) {
        response.on('data', (d) => {
            file.write(d);
        })

        response.on('end', () => {
            // file.end();
            file.close(cb);
        })
        // file.on('finish', function() {
        //   // close() is async, call cb after close completes.
        // });
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
            
            if(key == "modified" || key == "version" || key == "file_size" || key == "created") {
                tx_row[key] = parseInt(value);
            } else {
                tx_row[key] = value;
            }
        }); 

        return tx_row;
    });

    let transaction = persistence_transaction;

    if(persistence_transaction.hasOwnProperty('action_tx_id')) {
        transaction = await arweave.transactions.get(persistence_transaction.action_tx_id).then(async (transaction) => {
            const tx_row = {id: transaction.id, tx_id: transaction.id};
            
            transaction.get('tags').forEach(tag => {
                let key = tag.get('name', { decode: true, string: true });
                let value = tag.get('value', { decode: true, string: true });
                
                if(key == "modified" || key == "version" || key == "file_size" || key == "created") {
                    tx_row[key] = parseInt(value);
                } else {
                    tx_row[key] = value;
                }
                
            }); 
    
            return tx_row;
        });
    }  

    if(!systemHasEnoughDiskSpace(Math.ceil(transaction.file_size * 2))) {
        showNotification(`Not enough disk space to download - ${required_space} bytes required`);

        return;
    }

    // createTempFolder();


    const sync_folders = GetSyncedFolders();

    const is_encrypted = transaction.path.indexOf('Public') == -1;

    if(process.platform != 'win32') {
        transaction.file = transaction.file.split('\\').join('/');
        transaction.path = transaction.path.split('\\').join('/');
    }

    if(is_encrypted) {
        const save_file_encrypted = path.join(sync_folders[0], `${transaction.file.split(' ').join('_')}.enc`);

        downloadFile(`https://arweave.net/${transaction.id}`, save_file_encrypted, async (err) => {
            if (err) {
                console.error(err);
            }

            const wallet_file = walletFileSet();

            if(!wallet_file || wallet_file.length == 0) {
                showNotification(`Unable to download encrypted file ${save_file_encrypted} your wallet file is not set.`)

                fs.unlink(save_file_encrypted, (err) => {});
            }
            const jwk = getJwkFromWalletFile(wallet_file);

            const private_key = await getFileEncryptionKey(save_file_encrypted, transaction, jwk);
            const save_file = path.join(sync_folders[0], `${transaction.file}`);
            try {
                const result = await decryptFile(jwk, private_key, parseInt(transaction.key_size), save_file_encrypted, save_file);
            } catch(e) {
                console.log(e);

                if(fs.existsSync(save_file))
                    fs.renameSync(save_file, `${now}.del`);  // It's not going to affect the current open handles
                if(fs.existsSync(`${now}.del`))
                    fs.unlinkSync(`${now}.del`);
            }

            setFileTimestamps(save_file, transaction);

            const now = new Date().getTime();

            if(fs.existsSync(save_file_encrypted))
                fs.renameSync(save_file_encrypted, `${now}.del`);  // It's not going to affect the current open handles
            if(fs.existsSync(`${now}.del`))
                fs.unlinkSync(`${now}.del`);
        });
    } else {
        const save_file = path.join(sync_folders[0], transaction.file);

        downloadFile(`https://arweave.net/${transaction.id}`, save_file, (err) => {
            if (err) {
                console.error(err);
            }

            setFileTimestamps(save_file, transaction);
        });
    }

    updateFileMonitoringStatuses();

    AddSyncedFileFromTransaction(transaction);

    RemoveFileFromDownloads(transaction.file);

    RemoveProposedFileBy({file: transaction.file});   
    

    // removeTempFolder();
}

const setFileTimestamps = (file_path, file_info) => {
    const modified = file_info.modified;
    let created = modified;

    if(file_info.hasOwnProperty('created')) {
        created = file_info.created;
    }

    utimes(file_path, {
        btime: created,
        atime: file_info.modified,
        mtime: file_info.modified
    });
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
                values: ["${file_info.path}"]
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
        const sync_folders = GetSyncedFolders();
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
                
                if(tag.name == 'path' || tag.name == 'file') {
                    row[tag.name] = normalizePath(tag.value.replace(sync_folders[0], ''));
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

    const transaction = await arweave.createTransaction({data:'PERSISTENCE_RECORD'}, wallet_jwk);

    transaction.addTag('App-Name', settings.APP_NAME);
    transaction.addTag('Content-Type', 'PERSISTENCE');
    transaction.addTag('file', synced_file.file);
    transaction.addTag('path', synced_file.path);
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

    let cursor = '';
    let hasNextPage = true;
    const persistence_records = {};

    while(hasNextPage) {
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
                ]
                after: "${cursor}"
                first: 100	) {
                    pageInfo {
                        hasNextPage
                    }
                    edges {
                        node {
                            id
                            tags {
                                name
                                value
                            }
                            block {
                                timestamp
                                height
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

        const data = response.data.data;

        if(response.status == 200) {
            for(let i in data.transactions.edges) {
                const row = data.transactions.edges[i].node;

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

                if(persistence_records.hasOwnProperty(row.file)) {
                    const current_record = persistence_records[row.file];
                    if(current_record.modified < row.modified) {
                        persistence_records[row.file] = row;
                    }
                } else {
                    persistence_records[row.file] = row;
                }
            }

            hasNextPage = data.transactions.pageInfo.hasNextPage;
        } else {
            hasNextPage = false;
        }

        

        if(hasNextPage) {
            cursor = data.transactions.edges[data.data.transactions.edges.length - 1].cursor;
        }
    }

    const final_rows = Object.keys(persistence_records).map(file_name => persistence_records[file_name]);

    return final_rows;
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
