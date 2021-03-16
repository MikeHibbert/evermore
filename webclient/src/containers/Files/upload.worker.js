const fs = require('fs');
const { toast } = require('react-toastify');
const {
    encryptFile
} = require('../../crypto/files');

/* eslint-disable */

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
    reader.readAsArrayBuffer(file_info.file_handle);
}

/* eslint-enable */