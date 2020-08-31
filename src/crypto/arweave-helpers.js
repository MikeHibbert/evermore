const Arweave = require('arweave/node');
const fs = require('fs');
import { readContract, selectWeightedPstHolder  } from 'smartweave';
import {settings} from '../config';
import regeneratorRuntime from "regenerator-runtime";
import {
    walletFileSet, 
    UpdatePendingFileTransactionID, 
    ConfirmSyncedFile, 
    SaveUploader, 
    RemoveUploader,
    RemovePendingFile
} from '../db/helpers';

export const arweave = Arweave.init({
    host: "arweave.net",
    port: 443,
    protocol: 'https',
    timeout: 20000,
    logging: false
});

export const getJwkFromWalletFile = (path) => {
    const rawdata = fs.readFileSync(path);
    const jwk = JSON.parse(rawdata);

    return jwk;
}

export const getWalletBalance = (path) => {
    const jwk = getJwkFromWalletFile(path);

    return arweave.wallets.jwkToAddress(jwk).then((address) => {
        return arweave.wallets.getBalance(address).then((balance) => {
            return arweave.ar.winstonToAr(balance);
        })
    });
}

export const getWalletAddress = async (path) => {
    const jwk = getJwkFromWalletFile(path);

    return arweave.wallets.jwkToAddress(jwk).then((address) => {
        return address;
    });
}

export const uploadFile = async (file_info) => {
    console.log(`uploading ${file_info.file}`);

    const wallet_file = walletFileSet();

    if(!wallet_file || wallet_file.length == 0) return;

    const jwk = getJwkFromWalletFile(wallet_file);

    fs.exists(file_info.path, async (exists) => {
        if(!exists) {
            RemovePendingFile(file_info.path);
        } else {
            const file_data = fs.readFileSync(file_info.path);
            try {
                const transaction = await arweave.createTransaction({
                    data: file_data
                }, jwk);

                transaction.addTag('App', settings.APP_NAME);
                transaction.addTag('file', file_info.file.replace(/([^:])(\/\/+)/g, '$1/'));
                transaction.addTag('path', file_info.path.replace(/([^:])(\/\/+)/g, '$1/'));
                transaction.addTag('modified', file_info.modified);
                transaction.addTag('hostname', file_info.hostname);
                transaction.addTag('version', file_info.version);

                await arweave.transactions.sign(transaction, jwk);

                UpdatePendingFileTransactionID(file_info.file, transaction.id);

                let uploader = await arweave.transactions.getUploader(transaction);

                
                SaveUploader(uploader);

                // debugger;
                // while (!uploader.isComplete) {
                //     await uploader.uploadChunk();
                //     console.log(`${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`);
                // }

                ConfirmSyncedFile(transaction.id);

                const cost = await arweave.transactions.getPrice(transaction.data_size);
                sendUsagePayment(arweave.ar.winstonToAr(cost));

                RemoveUploader(uploader);

                console.log(`${file_info.path} uploaded`);
            } catch (e) {
                
                console.log(e);
            }

            

        }        
    }); // for whatever reason this file is now gone!
}

export const sendUsagePayment = async (transaction_cost) => {
    const wallet_file = walletFileSet();

    if(!wallet_file || wallet_file.length == 0) return;

    const jwk = getJwkFromWalletFile(wallet_file);

    const contractState = await readContract(arweave, settings.CONTRACT_ADDRESS);

    const holder = selectWeightedPstHolder(contractState.balances)
     // send a fee. You should inform the user about this fee and amount.
    try {
        const tx = await arweave.createTransaction({ 
            target: holder, 
            quantity: calculatePSTPayment(transaction_cost)}
            , jwk);
            
        await arweave.transactions.sign(tx, jwk);
        await arweave.transactions.post(tx);
    } catch (e) {
        console.log(e);
    }
    
}

export const calculatePSTPayment = (transaction_cost) => {
    return transaction_cost * settings.USAGE_PERCENTAGE;
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
            expr1: "App",
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

    return tx_rows;
}

export const finishUpload = async (savedUploader) => {
    let resumeObject = JSON.parse(savedUploader);

    const transaction = await arweave.transactions.get(resumeObject.id).then(async (transaction) => {
        const tx_row = {};
        
        tx.get('tags').forEach(tag => {
            let key = tag.get('name', { decode: true, string: true });
            let value = tag.get('value', { decode: true, string: true });
            
            if(key == "modified" || key == "version") {
                tx_row[key] = parseInt(value);
            } else {
                tx_row[key] = value;
            }
            
        });  

        let data = fs.readFileSync(tx_row.path);

        let uploader = await arweave.transactions.getUploader(resumeObject, data);

        while (!uploader.isComplete) {
            await uploader.uploadChunk();
        }

        ConfirmSyncedFile(uploader.transaction.id);

        RemoveUploader(uploader);

        const cost = await arweave.transactions.getPrice(transaction.data_size);
        sendUsagePayment(arweave.ar.winstonToAr(cost));
    })
    .catch(err => {
        console.log(`finishUpload: ${err}`);
    });    
}

export const getTransactionStatus = async (tx_id) => {
    return await arweave.transactions.getStatus(tx_id);
}

export const confirmTransaction = async (tx_id) => {
    const status = await getTransactionStatus(tx_id);
    console.log(JSON.stringify(status));
}
