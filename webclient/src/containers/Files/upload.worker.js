const fs = require('fs');
const { getWalletBalance } = require('../../crypto/arweave-helpers');
const { toast } = require('react-toastify');
// import arweave from '../../arweave-config';
import {
    encryptFile
} from '../../crypto/files';

// export async function uploadFileHandler (e) { // eslint-disable-line no-restricted-globals
   
//     const wallet_jwk = e[0];
//     const file_info = e[1];
//     const wallet_balance = e[2];
//     const is_public = e[3];
//     const key_size = e[4];

//     const data_cost = await arweave.transactions.getPrice(parseInt(file_info.file_size));

//     const showNotification = (message) => toast(message, { type: toast.TYPE.SUCCESS }); 
    
//     uploadFile(wallet_jwk, wallet_balance, file_info, data_cost, is_public, key_size, (msg) => {console.log(msg); postMessage(msg)}, showNotification);
// }

export async function encryptFileHandler(e) {
    const file_info = e[0];
    const wallet_jwk = e[1]  
    const jwk = e[2]; 
    const wallet_balance = e[3];

    const showNotification = (message) => toast(message, { type: toast.TYPE.SUCCESS });

    postMessage({action: 'encrypting', encrypting: true});
    postMessage({action: 'progress', progress: 0});

    const reader = new FileReader();
    reader.onload = async function() {
        let file_data = reader.result;

        const encrypted_result = await encryptFile(wallet_jwk, jwk, file_data, (msg) => {postMessage(msg)});

        postMessage({action: 'encrypting', encrypting: false});
        postMessage({action: 'begin-upload', encrypted_result: encrypted_result, file_info: file_info});
    }
    reader.readAsText(file_info.file_handle);
}