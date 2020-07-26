const Arweave = require('arweave/node');
const fs = require('fs');
import {walletFileSet, GetPendingFile, SaveUploader, RemoveUploader} from '../db/helpers';

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

export const uploadFile = async (file_info) => {
    console.log(`uploading ${file_info.path}`);

    const wallet_file = walletFileSet();

    if(!wallet_file || wallet_file.length == 0) return;

    const jwk = getJwkFromWalletFile(wallet_file);

    const file_data = fs.readFileSync(file_info.path);

    const transaction = await arweave.createTransaction({
        data: file_data
    }, jwk);

    transaction.addTag('path', file_info.path);
    transaction.addTag('modified', file_info.modified);

    await arweave.transaction.sign(transaction, key);

    let uploader = await arweave.transactions.getUploader(transaction);

    SaveUploader(uploader);

    while (!uploader.isComplete) {
        await uploader.uploadChunk();
        console.log(`${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`);
    }

    RemoveUploader(uploader);

    console.log(`${file_info.path} uploaded`);
}

export const getTransactionStatus = (tx_id) => {

}
