const axios = require('axios');
const fs = require('fs');
const NodeRSA = require('node-rsa');
const NodeJWK = require('node-jwk');

const wallet_str = fs.readFileSync('/home/mike/Documents/Arweave/arweave-keyfile-h-Bgr13OWUOkRGWrnMT0LuUKfJhRss5pfTdxHmNcXyw.json');
const wallet = JSON.parse(wallet_str);

const decryptFileData = async (wallet, transaction, data, postMessage) => {
    return new Promise((resolve, reject) => {
        let crc_result = '';
        var dataSizeInBytes = data.byteLength - transaction.key_size;

        getFileEncryptionKey(data, transaction, wallet).then(private_pem_key => {
            const private_key = PEM2RSAKey(private_pem_key); 
            
            const data_to_decrypt = Buffer.from(data).slice(transaction.key_size);

            const decrypted_data = private_key.decryptWithProgressMessages(data_to_decrypt, (msg) => {postMessage(msg)});

            return resolve(decrypted_data); 
        });   
    });
}

const getFileEncryptionKey = (data, transaction, wallet) => {
    return new Promise((resolve, reject) => {
        const key_data = data.slice(0, transaction.key_size);
        resolve(decryptDataWithWallet(Buffer.from(key_data, 'binary'), wallet).toString('utf8'));
    });
}

const decryptDataWithWallet = (buff, wallet) => {
    const walletPEM = wallet2PEM(wallet); 

    const key = PEM2RSAKey(walletPEM.private);

    try {
        return key.decrypt(buff);
    } catch(e) {
        console.log(e);
    }
    
}

const wallet2PEM = wallet => {
    const jwk = NodeJWK.JWK.fromObject(wallet);

    return {
        public: jwk.key.toPublicKeyPEM().toString('base64'),
        private: jwk.key.toPrivateKeyPEM().toString('base64')
    };
};

const PEM2RSAKey = PEM => {
    const rsa = new NodeRSA(PEM);

    return rsa;
};

axios({
    url: `https://arweave.net/PsNPufdAcuisKyXfuKjKN6Kb2JdTdxfPrda3FKueIns`,
    responseType: 'arraybuffer'
}).then(response => {
    let data = response.data;  

    console.log(typeof data);

    getFileEncryptionKey(data, {key_size: 3584}, wallet).then(private_pem_key => {
        console.log(private_pem_key);

        const private_key = PEM2RSAKey(private_pem_key); 

        debugger;
        
        const data_to_decrypt = data.slice(3584);

        const decrypted_data = private_key.decrypt(data_to_decrypt);

        
        console.log(decrypted_data.toString());
    });

    // let test_data = fs.readFileSync('community-logo.png.enc', {encoding: 'binary'});

    const readStream = fs.createReadStream('community-logo.png.enc', {encoding: null});

    const chunks = [];
    readStream.on('readable', () => {
        let data = readStream.read();

        while(data != null) {
            chunks.push(data);
            data = readStream.read();
        }

        const buff = Buffer.concat(chunks);

        debugger;

        getFileEncryptionKey(buff, {key_size: 3584}, wallet).then(private_pem_key => {
            console.log(private_pem_key);

            const private_key = PEM2RSAKey(private_pem_key); 

            debugger;
            
            const data_to_decrypt = buff.slice(3584);

            const decrypted_data = private_key.decrypt(data_to_decrypt);

            
            console.log(decrypted_data.toString());
        });
    })

    // console.log(typeof test_data);   

    // getFileEncryptionKey(data, {key_size: 3584}, wallet).then(key => {
    //     console.log(key);
    // });

    
})