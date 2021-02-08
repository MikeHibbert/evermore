import mime from 'mime-types';
import axios from 'axios';
import path from 'path';
import { readContract, selectWeightedPstHolder  } from 'smartweave';
import fs from 'fs';
import fse from 'fs-extra';
import crypto from 'crypto';
import settings from '../app-config';
import {
    createCRCFor,
    normalizePath,
    denormalizePath,
    systemHasEnoughDiskSpace,
} from '../fsHandling/helpers';
import {
    encryptFile,
    decryptFileData,
    encryptDataWithRSAKey,
    getFileEncryptionKey
} from './files';
import { utimes } from 'utimes';
import arweave from './arweave-config';

export const getJwkFromWallet = (file_path) => {
    const rawdata = fs.readFileSync(file_path);
    const jwk = JSON.parse(rawdata);

    return jwk;
}

export const getWalletBalance = async (file_path, jwk) => {
    try {
        return arweave.wallets.jwkToAddress(jwk).then((address) => {
            return arweave.wallets.getBalance(address).then((balance) => {
                return arweave.ar.winstonToAr(balance);
            })
        });
    } catch(e) {
        return 0;
    }
    
}

export const getWalletAddress = async (file_path, jwk) => {
    return arweave.wallets.jwkToAddress(jwk).then((address) => {
        return address;
    });
}

export const uploadFile = async (file_info, encrypt_file, wallet_jwk, messageCallback, showNotification) => {
    
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

        const wallet_balance = await getWalletBalance(wallet_jwk);
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

        let uploader = await arweave.transactions.getUploader(transaction);

        //const uploader_record = SaveUploader(uploader);

        while (!uploader.isComplete) {
            await uploader.uploadChunk();
            messageCallback({percentage: uploader.pctComplete});
            // console.log(`${file_info.path} : ${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`);
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


        console.log(`${file_info.path} uploaded`);
    } catch (e) {
        console.log(e);
    }   
}

export const getFileData = (file_path) => {
    const data = fs.readFileSync(file_path);

    return data;
}

export const sendUsagePayment = async (transaction_cost, jwk) => {
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

export const setFileStatusAsArchived = async (file_info, wallet_jwk, showNotification) => {
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


export const createPersistenceRecord = async (synced_file, deleted, wallet_jwk) => {
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

export const getPersistenceRecords = async (jwk) => {
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

export const getPersistenceRecordsFor = async (file_path, jwk) => {
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
