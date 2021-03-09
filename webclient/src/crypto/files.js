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

function concatTypedArrays(a, b) { // a, b TypedArray of same type
    var c = new (a.constructor)(a.length + b.length);
    c.set(a, 0);
    c.set(b, a.length);
    return c;
}

function concatBuffers(a, b) {
    return concatTypedArrays(
        new Uint8Array(a.buffer || a), 
        new Uint8Array(b.buffer || b)
    ).buffer;
}

export const MAX_CHUNK_SIZE = 256 * 1024;

function Utf8ArrayToStr(array) {
    var out, i, len, c;
    var char2, char3;

    out = "";
    len = array.length;
    i = 0;
    while(i < len) {
    c = array[i++];
    switch(c >> 4)
    { 
      case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
        // 0xxxxxxx
        out += String.fromCharCode(c);
        break;
      case 12: case 13:
        // 110x xxxx   10xx xxxx
        char2 = array[i++];
        out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
        break;
      case 14:
        // 1110 xxxx  10xx xxxx  10xx xxxx
        char2 = array[i++];
        char3 = array[i++];
        out += String.fromCharCode(((c & 0x0F) << 12) |
                       ((char2 & 0x3F) << 6) |
                       ((char3 & 0x3F) << 0));
        break;
    }
    }

    return out;
}

export const encryptFile = async (wallet, jwk, data, progressMessage) => {
    return new Promise(async (resolve, reject) => {
        const key = wallet2PEM(jwk);
        const private_key = PEM2RSAKey(key.private); 
        const wallet_key = wallet2PEM(wallet);        

        const decode_key = encryptDataWithRSAKey(Buffer.from(key.private, 'binary'), wallet_key.private);

        const encrypted_data = private_key.encryptWithProgressMessages(Buffer.from(data), (msg) => {progressMessage(msg)} );

        const buffer = arweave.utils.concatBuffers([decode_key, encrypted_data]);

        resolve({
            key_size: Buffer.byteLength(decode_key, 'binary'), 
            encrypted_data: buffer,
            data: data,
            key: decode_key
        });
     
    });
}

export const decryptFileData = async (wallet, transaction, data, postMessage) => {
    return new Promise((resolve, reject) => {
        data = Buffer.from(data, 'binary');
        let crc_result = '';
        var dataSizeInBytes = data.byteLength - transaction.key_size;

        getFileEncryptionKey(data, transaction, wallet).then(private_pem_key => {
            const private_key = PEM2RSAKey(private_pem_key); 
            
            const data_to_decrypt = data.slice(transaction.key_size);
            
            const decrypted_data = private_key.decryptWithProgressMessages(data_to_decrypt, (msg) => {postMessage(msg)});

            return resolve(decrypted_data); 
        });
    });
}

export const getFileEncryptionKey = (data, transaction, wallet) => {
    return new Promise((resolve, reject) => {
        const key_data = data.slice(0, transaction.key_size);
        resolve(decryptDataWithWallet(Buffer.from(key_data, 'binary'), wallet).toString('utf8'));
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
    return PEM2RSAKey(private_pem_key).encrypt(data);
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