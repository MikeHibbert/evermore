const fs = require('fs');
const crypto = require('crypto');
const stream = require('stream');
const util = require('util');
const NodeRSA = require('node-rsa');
const NodeJWK = require('node-jwk');
const zlib = require('zlib');
import { https } from 'follow-redirects';
import regeneratorRuntime from "regenerator-runtime";
import { arweave } from './arweave-helpers';

const pipeline = util.promisify(stream.pipeline); // for pipelining downloads

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

export const decryptFile = async (wallet, private_pem_key, start, file_path, dest_path) => {
    return new Promise((resolve, reject) => {
        let crc_result = '';

        var stats = fs.statSync(file_path);
        var dataSizeInBytes = stats.size - start;

        const private_key = PEM2RSAKey(private_pem_key);      

        const readStream = fs.createReadStream(file_path, {encoding: null, start: start});
        const writeableStream = fs.createWriteStream(dest_path, {encoding: null, highWaterMark: MAX_CHUNK_SIZE});

        fs.open(file_path, 'r', (status, fd) => {
            if (status) {
                reject(status.message);
                return;
            }

            var buffer = new Buffer.alloc(dataSizeInBytes);
            fs.read(fd, buffer, 0, dataSizeInBytes, start, function(err, num, data) {
                if(err) return reject(err);

                const decrypted_data = private_key.decrypt(data);

                writeableStream.write(decrypted_data);
                writeableStream.close();

                return resolve({
                    file_path: dest_path
                });
            });
        });

        // readStream.on('readable', () => {
        //     let data = readStream.read();

        //     const chunks = [];

        //     while(data != null) {
        //         chunks.push(data);
        //         data = readStream.read();
        //     }

        //     const decrypted_data = private_key.decrypt(Buffer.concat(chunks));
        //     writeableStream.write(decrypted_data);
        // });

        // readStream.on('end', () => {
        //     writeableStream.close();
        //     return resolve({
        //         file_path: dest_path
        //     });
        // });

        // readStream.on('error', (err) => {
        //     return reject(err);
        // });      
    });
}

export const getFileEncryptionKey = (file_path, transaction, wallet) => {
    return new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(file_path, {encoding: null, start: 0, end: transaction.key_size - 1});

        const chunks = [];

        readStream.on('readable', () => {
            let data = readStream.read();

            while(data != null) {
                chunks.push(data);
                data = readStream.read();
            }

            resolve(decryptDataWithWallet(Buffer.concat(chunks), wallet).toString('utf8'));
        });
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
        fs.unlink(dest); // Delete the file async. (But we don't check the result)
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