const fs = require('fs');
const stream = require('stream');
const util = require('util');
const NodeRSA = require('node-rsa');
const NodeJWK = require('node-jwk');
const zlib = require('zlib');
import { https } from 'follow-redirects';
import regeneratorRuntime from "regenerator-runtime";

const pipeline = util.promisify(stream.pipeline); // for pipelining downloads

export const encryptFile = async (wallet, jwk, file_path, dest_path) => {
    return new Promise((resolve, reject) => {
        let crc_result = '';

        const key = wallet2PEM(jwk);
        const wallet_key = wallet2PEM(wallet);        

        const readStream = fs.createReadStream(file_path, {encoding: 'binary'});
        const writeableStream = fs.createWriteStream(dest_path, {encoding: 'binary'});

        const decode_key = encryptDataWithRSAKey(key.private, wallet_key.private);

        writeableStream.write(decode_key);

        readStream.on('data', (chunk) => {
            writeableStream.write(encryptDataWithRSAKey(chunk, key.private));
        });

        readStream.on('end', () => {
            writeableStream.close();
            
            return resolve({
                file_path: dest_path, 
                key_size: Buffer.byteLength(decode_key, 'binary'), 
                key: decode_key
            });
        });

        readStream.on('error', (err) => {
            return reject(err);
        });

        readStream.read();        
    });
}

export const decryptFile = async (wallet, private_pem_key, start, file_path, dest_path) => {
    return new Promise((resolve, reject) => {
        let crc_result = '';

        const private_key = PEM2RSAKey(private_pem_key);      

        const readStream = fs.createReadStream(file_path, {encoding: 'binary', start: start});
        const writeableStream = fs.createWriteStream(dest_path, {encoding: 'binary'});

        readStream.on('data', (chunk) => {
            writeableStream.write(private_key.decrypt(Buffer.from(chunk, 'binary'), 'binary'));
        });

        readStream.on('end', () => {
            writeableStream.close();
            return resolve({
                file_path: dest_path
            });
        });

        readStream.on('error', (err) => {
            return reject(err);
        });

        readStream.read();        
    });
}

export const getFileEncryptionKey = (file_path, transaction, wallet) => {
    return new Promise((resolve, reject) => {
        fs.open(file_path, 'r', function(status, fd) {
            if (status) {
                return reject(status);
            }

            const buff = new Buffer.alloc(parseInt(transaction.key_size));

            fs.read(fd, buff, 0, transaction.key_size, 0, (err, bytesRead, buffer) => {
                return resolve(decryptDataWithWallet(buffer.toString('binary'), wallet).toString('utf8'));
            })
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

    return key.decrypt(Buffer.from(buff, 'binary'), 'binary');
}

export const encryptDataWithRSAKey = (data, private_pem_key) => {
    return PEM2RSAKey(private_pem_key).encrypt(data, 'binary');
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