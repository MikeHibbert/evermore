import axios from 'axios';
import { decryptFileData } from '../../crypto/files';

export const downloadFile = async function(e) { // eslint-disable-line no-restricted-globals
    // if (!e) return;

    // const users = [];

    // const userDetails = {
    // 	name: 'Jane Doe',
    // 	email: 'jane.doe@gmail.com',
    // 	id: 1
    // };

    // for (let i = 0; i < 10000000; i++) {

    // 	userDetails.id = i++
    // 	userDetails.dateJoined = Date.now()

    // 	users.push(userDetails);
    // }

    // postMessage(users);

    

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
            decryptFileData(wallet, file_info, data, postMessage).then(decrypted_data => {
                    postMessage({action: 'download-complete', decrypting: false, data: new Blob([decrypted_data])});
            });
            
        } else {
            postMessage({action: 'download-complete', data: data, decrypting: false,});
        }
    });
};

export default downloadFile;