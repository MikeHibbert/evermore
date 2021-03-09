const axios = require('axios');
const { decryptFileData } = require('../../crypto/files');

export const downloadFile = async function(e) { // eslint-disable-line no-restricted-globals
    const wallet = e[0]
    const file_info = e[1];    
    axios({
        url: `https://arweave.net/${file_info.id}`,
        responseType: 'blob',
        onDownloadProgress: function (progressEvent) {
            // Do whatever you want with the native progress event
            const percent = Math.floor(progressEvent.loaded / progressEvent.total * 100);
            postMessage({action: 'progress', progress: percent});
        },
    }).then(response => {
        postMessage({action: 'downloading', downloading: false});
        let data = response.data;

        const parts = file_info.path.split("/");
        const filename = parts[parts.length - 1];

        if(file_info.domain == 'Private') {
            postMessage({action: 'decrypting', decrypting: true});
            data.arrayBuffer().then(buff => {
                decryptFileData(wallet, file_info, buff, postMessage).then(decrypted_data => {
                    postMessage({action: 'download-complete', decrypting: false, data: new Blob([decrypted_data]), file_info: file_info});
                });
            })
            
            
        } else {
            postMessage({action: 'download-complete', data: data, decrypting: false,});
        }
    });
};

export default downloadFile;