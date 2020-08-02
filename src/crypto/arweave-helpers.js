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
    RemoveUploader
} from '../db/helpers';

export const arweave = Arweave.init({
    host: "arweave.net",
    port: 443,
    protocol: 'https',
    timeout: 20000,
    logging: false
});

async function getPrice(data_size_in_bytes) {
    const url = `/price/${data_size_in_bytes}`;
    return this.api.get(url);
}

arweave['getPrice'] = getPrice;

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

export const uploadFile = async (file_info) => {
    console.log(`uploading ${file_info.file}`);

    const wallet_file = walletFileSet();

    if(!wallet_file || wallet_file.length == 0) return;

    const jwk = getJwkFromWalletFile(wallet_file);

    const file_data = fs.readFileSync(file_info.path);

    const transaction = await arweave.createTransaction({
        data: file_data
    }, jwk);

    transaction.addTag('App', settings.APP_NAME);
    transaction.addTag('path', file_info.file.replace(/([^:])(\/\/+)/g, '$1/'));
    transaction.addTag('modified', file_info.modified);
    transaction.addTag('hostname', file_info.hostname);

    await arweave.transactions.sign(transaction, jwk);

    debugger;

    UpdatePendingFileTransactionID(file_info.file, transaction.id);

    let uploader = await arweave.transactions.getUploader(transaction);

    
    SaveUploader(uploader);

    // debugger;
    // while (!uploader.isComplete) {
    //     await uploader.uploadChunk();
    //     console.log(`${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`);
    // }

    ConfirmSyncedFile(transaction.id);

    const cost = await arweave.getPrice(transaction.data_size);
    //sendUsagePayment(arweave.ar.winstonToAr(cost));

    RemoveUploader(uploader);

    console.log(`${file_info.path} uploaded`);
}

export const sendUsagePayment = async (transaction_cost) => {
    const wallet_file = walletFileSet();

    if(!wallet_file || wallet_file.length == 0) return;

    const jwk = getJwkFromWalletFile(wallet_file);

    const contractState = await readContract(arweave, settings.CONTRACT_ADDRESS);

    const holder = selectWeightedPstHolder(contractState.balances)
     // send a fee. You should inform the user about this fee and amount.
    const tx = await arweave.transactions.createTransaction({ 
        target: holder, 
        quantity: transaction_cost * settings.USAGE_PERCENTAGE}
        , jwk);
        
    await arweave.transactions.sign(tx, jwk);
    await arweave.transactions.post(tx);
}

export const getDownloadableFiles = async () => {
    const wallet_file = walletFileSet();

    if(!wallet_file || wallet_file.length == 0) return;

    const jwk = getJwkFromWalletFile(wallet_file);

    const windows = settings.PLATFORM === "win32";

    const address = await arweave.wallets.jwkToAddress(jwk);

    const txids = await arweave.arql({
        op: "and",
        expr1: {
          op: "equals",
          expr1: "from",
          expr2: address
        },
        expr2: {
          expr1: {
            op: "equals",
            expr1: "App",
            expr2: settings.APP_NAME
          }
        }
      });
}

export const finishUpload = async (savedUploader) => {
    let resumeObject = JSON.parse(savedUploader);

    const transaction = await arweave.transactions.get(resumeObject.id).then(async (transaction) => {
        let data = fs.readFileSync(path);

        let uploader = await arweave.transactions.getUploader(resumeObject, data);

        while (!uploader.isComplete) {
            await uploader.uploadChunk();
        }

        ConfirmSyncedFile(uploader.transaction.id);

        RemoveUploader(uploader);
    })
    .catch(err => {
        console.log(`finishUpload: ${err}`);
    })

    
}

export const getTransactionStatus = async (tx_id) => {
    return await arweave.transactions.getStatus(tx_id);
}

export const confirmTransaction = async (tx_id) => {
    const status = await getTransactionStatus(tx_id);
    console.log(JSON.stringify(status));
}
