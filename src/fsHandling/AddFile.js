import {
    AddPendingFile, 
    GetPendingFile, 
    GetSyncedFile, 
    ConfirmSyncedFileFromTransaction,
    GetExclusions
} from '../db/helpers';
import path from 'path';
import regeneratorRuntime from "regenerator-runtime";
import {sendMessage} from '../integration/server';
import {getFileUpdatedDate, getRalativePath, createCRCFor, pathFoundInPathInfos} from '../fsHandling/helpers';
import {getDownloadableFiles} from '../crypto/arweave-helpers';

const fileAddedHandler = (file_path) => {
    console.log(`File ${file_path} has been added`)

    getDownloadableFiles().then(async downloadable_files => {
        const new_file_modified = getFileUpdatedDate(file_path);
        const relative_path = getRalativePath(file_path);
        const current_crc = await createCRCFor(file_path);

        let found_in_downloadables = false;
        let confirmed_in_blockchain = false;

        if(downloadable_files.length > 0) {
            for(let i in downloadable_files) {
                const downloadable_file = downloadable_files[i];

                if(downloadable_file.file === relative_path) {
                    if(new_file_modified > downloadable_file.modified) {
                        if(!GetPendingFile(file_path)) {
                            if(downloadable_file.hasOwnProperty('crc')) {
                                if(downloadable_file.crc != current_crc) {
                                    const exclusions = GetExclusions();

                                    if(!pathFoundInPathInfos(path.normalize(file_path), exclusions)) {
                                        AddPendingFile(null, path.normalize(file_path), downloadable_file.version + 1);
                                        sendMessage(`REGISTER_PATH:${file_path}\n`, true);
                                        confirmed_in_blockchain = true;
                                    }                                    
                                }                                
                            }                            
                        }
                    } else {
                        if(!GetSyncedFile(downloadable_file.id)) {
                            ConfirmSyncedFileFromTransaction(file_path, downloadable_file);
                            sendMessage(`REGISTER_PATH:${file_path}\n`, true);
                            confirmed_in_blockchain = true;
                        }
                    }          
                    found_in_downloadables = true;    
                }
            }
        } 
        if(!found_in_downloadables && !confirmed_in_blockchain) {
            if(!GetPendingFile(file_path)) {
                const exclusions = GetExclusions();

                if(!pathFoundInPathInfos(path.normalize(file_path), exclusions)) {
                    AddPendingFile(null, file_path, 1);
                    sendMessage(`REGISTER_PATH:${file_path}\n`, true);
                }
            }
        }
    });    
}

export default fileAddedHandler;