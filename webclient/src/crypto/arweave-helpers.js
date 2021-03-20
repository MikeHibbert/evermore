import mime from 'mime-types';
import axios from 'axios';
import path from 'path';
import { readContract, selectWeightedPstHolder, interactWrite  } from 'smartweave';
import fs from 'fs';
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
    getFileEncryptionKey, 
} from './files';
import {escapeText} from '../containers/Files/helpers';

// import { utimes } from 'utimes';
// import arweave from '../arweave-config';

export const getJwkFromWallet = (file_path) => {
    const rawdata = fs.readFileSync(file_path);
    const jwk = JSON.parse(rawdata);

    return jwk;
}

export const getWalletBalance = async (file_path, jwk, arweave) => {
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

export const getWalletAddress = async (file_path, jwk, arweave) => {
    return arweave.wallets.jwkToAddress(jwk).then((address) => {
        return address;
    });
}

export const uploadFile = async (
    wallet_jwk, wallet_balance, file_info, data_cost, is_public, key_size, arweave, messageCallback, showSuccessNotification, showErrorNotification, 
    isNFT=false, nftName=null, nftDescription=null
    ) => {                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
    try {        
        const path_parts = file_info.path.split('/');
        const filename = path_parts[path_parts.length - 1];

        const transaction = await arweave.createTransaction({
            data: file_info.file_data
        }, wallet_jwk);

        const total_winston_cost = parseInt(transaction.reward) + parseInt(data_cost);
        const total_data_cost = parseFloat(arweave.ar.winstonToAr(total_winston_cost));
        debugger;
        const total_ar_cost = total_data_cost + parseFloat(calculatePSTPayment(total_data_cost));   

        if(wallet_balance < total_ar_cost) {
            showErrorNotification(`Your wallet does not contain enough AR to upload, ${total_ar_cost} AR is needed `)
    
            return;
        }

        if(isNFT) {
            const wallet_address = await arweave.wallets.jwkToAddress(wallet_jwk);
            const nft_name = escapeText(nftName);
            const description = escapeText(nftDescription);
            const ticker = nft_name.split(' ').join('_').toUpperCase();
            transaction.addTag('App-Name', "SmartWeaveContract");
            
            transaction.addTag('Exchange', "Verto");
            transaction.addTag('Action', "marketplace/create");
            transaction.addTag('App-Version', "0.3.0");
            transaction.addTag('Contract-Src', "I8xgq3361qpR8_DvqcGpkCYAUTMktyAgvkm6kGhJzEQ");
            transaction.addTag('Init-State', `{"balances":{"${wallet_address}": 1},"name":"${nft_name}","ticker":"${ticker}","description":"${description} - Created with Evermore"}`);
            transaction.addTag('Signing-Client', "Evermore Webclient");
        } else {
            transaction.addTag('App-Name', settings.APP_NAME);
        }
        
        transaction.addTag('Application', "Evermore");
        transaction.addTag('Content-Type', mime.lookup(file_info.file));
        transaction.addTag('filename', filename);
        transaction.addTag('file', file_info.path);
        transaction.addTag('path', file_info.path);
        transaction.addTag('modified', file_info.modified);
        transaction.addTag('hostname', file_info.hostname);

        transaction.addTag('created', file_info.created);
        transaction.addTag('version', file_info.version);
        // transaction.addTag('CRC', crc_for_data);
        transaction.addTag('file_size', file_info.file_size);

        if (!is_public) {
            transaction.addTag('key_size', key_size);
            transaction.addTag('domain', 'Private');
        } else {
            transaction.addTag('domain', 'Public');
        }

        await arweave.transactions.sign(transaction, wallet_jwk);

        let uploader = await arweave.transactions.getUploader(transaction);

        //const uploader_record = SaveUploader(uploader);

        messageCallback({action: 'uploading', uploading: true});
        messageCallback({action: 'progress', progress: 0});

        while (!uploader.isComplete) {
            await uploader.uploadChunk();
            messageCallback({action: 'progress', progress: uploader.pctComplete});
            console.log(`${file_info.path} : ${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`);
        }

        console.log(`Uploaded tx ${transaction.id}`);

        messageCallback({uploading: false, progress: uploader.pctComplete});
        messageCallback({action: 'uploading', uploading: false});
        messageCallback({action: 'upload-complete', tx_id: transaction.id});

        file_info['id'] = transaction.id;

        debugger;

        sendUsagePayment(total_data_cost, wallet_jwk, arweave);

        

        showSuccessNotification(`${file_info.path} uploaded and will be mined shortly.`);
    } catch (e) {
        console.log(e);
    }   
}

export const getFileData = (file_path) => {
    const data = fs.readFileSync(file_path);

    return data;
}

export const sendUsagePayment = async (transaction_cost, wallet_jwk, arweave) => {
    const contractState = await readContract(arweave, settings.CONTRACT_ADDRESS);

    const holder = selectWeightedPstHolder(contractState.balances)

    debugger;
    
    const tx = await arweave.createTransaction({ 
            target: holder, 
            quantity: arweave.ar.arToWinston(calculatePSTPayment(transaction_cost))}
            , wallet_jwk);

    tx.addTag('EVERMORE_TOKEN', 'COMMUNITY REWARD PAYMENT');
            
    await arweave.transactions.sign(tx, wallet_jwk);
    await arweave.transactions.post(tx);
    
    return tx;
}

export const calculatePSTPayment = (transaction_cost) => {
    const payment = transaction_cost * settings.USAGE_PERCENTAGE;
    debugger;

    return payment.toString();
}

export const setFileStatusAsArchived = async (file_info, wallet_jwk, showNotification, arweave) => {
    const transaction = await arweave.createTransaction({}, wallet_jwk);

    const wallet_balance = await getWalletBalance(arweave);

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

export const getTransactionStatus = async (tx_id, arweave) => {
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

export const getTransactionWithTags = async (tx_id, arweave) => {
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


export const transactionExistsOnTheBlockchain = async (tx_id, arweave) => {
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


export const createPersistenceRecord = async (synced_file, deleted, wallet_jwk, arweave) => {
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

export const getPersistenceRecords = async (jwk, arweave) => {
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

export const getPersistenceRecordsFor = async (file_path, jwk, arweave) => {
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

export const transferNFTOwnership = async (arweave, wallet_jwk, contractTXID, targetAddress) => {
    await interactWrite(arweave, wallet_jwk, contractTXID, {functions: 'transfer', target: targetAddress});
}