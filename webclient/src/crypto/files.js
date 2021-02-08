import fs from 'fs';
import crypto from 'crypto';
import stream from 'stream';
import util from 'util';
import NodeRSA from 'node-rsa';
import NodeJWK from 'node-jwk';
import zlib from 'zlib';
import { https } from 'follow-redirects';
import Arweave from 'arweave/node';

const arweave = Arweave.init({
    host: 'arweave.net',// Hostname or IP address for a Arweave host
    port: 443,          // Port
    protocol: 'https',  // Network protocol http or https
    timeout: 20000,     // Network request timeouts in milliseconds
    logging: false,     // Enable network request logging
});

export const MAX_CHUNK_SIZE = 256 * 1024;

export const encryptFile = async (wallet, jwk, file_path, dest_path) => {
    return new Promise((resolve, reject) => {
        let crc_result = '';

        const key = wallet2PEM(jwk);
        const private_key = PEM2RSAKey(key.private); 
        const wallet_key = wallet2PEM(wallet);        
        const writeableStream = fs.createWriteStream(dest_path, {encoding: null, highWaterMark: MAX_CHUNK_SIZE});

        const decode_key = encryptDataWithRSAKey(key.private, wallet_key.private);

        writeableStream.write(Buffer.from(decode_key, 'binary'));

        fs.readFile(file_path, {encoding: null}, (err, data) => {
            if (err) reject(err);

            const encrypted_data = private_key.encrypt(data);

            writeableStream.write(encrypted_data);

            writeableStream.close();
            
            resolve({
                file_path: dest_path, 
                key_size: Buffer.byteLength(decode_key, 'binary'), 
                key: decode_key
            });
        });       
    });
}

export const decryptFileData = async (wallet, transaction, blob, postMessage) => {
    return new Promise((resolve, reject) => {
        blob.arrayBuffer().then(data => {
            let crc_result = '';
            var dataSizeInBytes = data.byteLength - transaction.key_size;

            getFileEncryptionKey(data, transaction, wallet).then(private_pem_key => {
                const private_key = PEM2RSAKey(private_pem_key); 
                
                const data_to_decrypt = Buffer.from(data).slice(transaction.key_size);

                const decrypted_data = private_key.decrypt(data_to_decrypt);

                return resolve(decrypted_data); 
            });
        });      
    });
}

export const getFileEncryptionKey = (data, transaction, wallet) => {
    return new Promise((resolve, reject) => {
        const key_data = data.slice(0, transaction.key_size);
        resolve(decryptDataWithWallet(Buffer.from(key_data), wallet).toString('utf8'));
    });
}

export const getOnlineDataEncryptionKey = async (transaction, callback, error_callback) => {
    const url = `https://arweave.net/${transaction.tx_id}`;
    const buff = [];
    const bytes_count = 0;

    var request = https.get(url, function(response) {
        response.on('data', data => {
            bytes_count += data.byteLength;

            if(bytes_count >= transaction.key_size) {
                response.close();
                const remainder_bytes = data.slice(0, bytes_count - transaction.key_size - 1);
            } else {
                buff.push(data);
            }
        });
    }).on('error', function(err) { // Handle errors
        // fs.unlink(dest); // Delete the file async. (But we don't check the result)
        if (error_callback) error_callback(err.message);
    });
}

export const decryptDataWithWallet = (buff, wallet) => {
    const walletPEM = wallet2PEM(wallet); 

    const key = PEM2RSAKey(walletPEM.private);

    return key.decrypt(buff, 'binary');
}

export const encryptDataWithRSAKey = (data, private_pem_key) => {
    const buff = Buffer.from(data, 'binary');
    return PEM2RSAKey(private_pem_key).encrypt(buff, 'binary');
}

export const encryptDataWithRSAPrivateKey = (data, private_pem_key) => {
    return PEM2RSAKey(private_pem_key).encryptPrivate(data, 'binary');
}

export const decryptDataWithRSAKey = (data, private_pem_key) => {
    return PEM2RSAKey(private_pem_key).decrypt(Buffer.from(data, 'binary'), 'binary');
}

export const wallet2PEM = wallet => {
    const jwk = NodeJWK.JWK.fromObject(wallet);

    return {
        public: jwk.key.toPublicKeyPEM().toString('base64'),
        private: jwk.key.toPrivateKeyPEM().toString('base64')
    };
};

export const PEM2RSAKey = PEM => {
    const rsa = new NodeRSA(PEM);

    return rsa;
};

export const zipKey = (private_key) => {
    const input = new Buffer.from(private_key.toString('base64'));
    return zlib.deflateSync(input);
}

export const unzipKey = (zipped_private_key) => {
    const input = new Buffer.from(zipped_private_key);
    return zlib.inflateSync(input).toString('utf8');
}