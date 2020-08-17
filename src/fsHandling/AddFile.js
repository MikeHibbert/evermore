import {
    AddPendingFile, 
    GetPendingFile, 
    GetSyncedFile, 
    ConfirmSyncedFileFromTransaction 
} from '../db/helpers';

import {sendMessage} from '../integration/server';
import {getFileUpdatedDate, getRalativePath} from '../fsHandling/helpers';
import {getDownloadableFiles} from '../crypto/arweave-helpers';

const fileAddedHandler = (path) => {
    console.log(`File ${path} has been added`)

    getDownloadableFiles().then(downloadable_files => {
        const new_file_modified = getFileUpdatedDate(path);
        const relative_path = getRalativePath(path);

        let found_in_downloadables = false;
        let confirmed_in_blockchain = false;

        if(downloadable_files.length > 0) {
            for(let i in downloadable_files) {
                const downloadable_file = downloadable_files[i];

                if(downloadable_file.file === relative_path) {
                    if(new_file_modified > downloadable_file.modified) {
                        if(!GetPendingFile(path)) {
                            AddPendingFile(null, path, downloadable_file.version + 1);
                            sendMessage(`REGISTER_PATH:${path}\n`, true);
                            confirmed_in_blockchain = true;
                        }
                    } else {
                        if(!GetSyncedFile(downloadable_file.id)) {
                            ConfirmSyncedFileFromTransaction(path, downloadable_file);
                            sendMessage(`REGISTER_PATH:${path}\n`, true);
                            confirmed_in_blockchain = true;
                        }
                    }          
                    found_in_downloadables = true;    
                }
            }
        } 
        if(!found_in_downloadables && !confirmed_in_blockchain) {
            if(!GetPendingFile(path)) {
                AddPendingFile(null, path, 1);
                sendMessage(`REGISTER_PATH:${path}\n`, true);
            }
        }
    });    
}

export default fileAddedHandler;