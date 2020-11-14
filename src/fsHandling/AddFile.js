import {
    AddProposedFile, 
    GetProposedFile, 
    GetDownloads, 
    GetSyncedFileBy, 
    ConfirmSyncedFileFromTransaction,
    GetExclusions,
    GetSyncedFileFromPathAndModified,
    GetDeletedFileFromPath, 
    UndeleteSyncedFile
} from '../db/helpers';
import path from 'path';
import regeneratorRuntime from "regenerator-runtime";
import {sendMessage} from '../integration/server';
import {
    getFileUpdatedDate, 
    getRalativePath, 
    createCRCFor, 
    pathExcluded
} from '../fsHandling/helpers';
import {getDownloadableFiles, getDownloadableFilesGQL} from '../crypto/arweave-helpers';
import { GetPendingFile } from '../../dist/db/helpers';

const fileAddedHandler = (file_path) => {
    if(file_path.endsWith('.enc')) {
        return;
    }

    const current_downloads = GetDownloads();
    const current_download_matches = current_downloads.filter(cd => cd.path == file_path);
    if(current_download_matches.length > 0) return;


    console.log(`File ${file_path} has been added`);

    const deleted_file = GetDeletedFileFromPath(file_path);

    if(deleted_file) {
        UndeleteSyncedFile(deleted_file.tx_id);
        return;
    }
    
    getDownloadableFilesGQL().then(async downloadable_files => {
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
                        if(!GetProposedFile(file_path)) {
                            if(downloadable_file.hasOwnProperty('crc')) {
                                if(downloadable_file.crc != current_crc) {
                                    const exclusions = GetExclusions();

                                    if(!pathExcluded(file_path) && !GetSyncedFileFromPathAndModified(file_path, new_file_modified)) {
                                        AddProposedFile(null, path.normalize(file_path), parseInt(downloadable_file.version + 1));
                                        sendMessage(`REGISTER_PATH:${file_path}\n`);
                                        confirmed_in_blockchain = true;
                                    }                                    
                                }                                
                            }                            
                        }
                    } else {
                        const sync_file = GetSyncedFileBy({file: downloadable_file.file});
                        if(sync_file) {
                            ConfirmSyncedFileFromTransaction(file_path, downloadable_file);
                            sendMessage(`REGISTER_PATH:${file_path}\n`);
                            confirmed_in_blockchain = true;
                        }
                    }          
                    found_in_downloadables = true;    
                }
            }
        } 
        if(!found_in_downloadables && !confirmed_in_blockchain) {
            const pending = GetPendingFile(file_path);
            const synced = GetSyncedFileFromPathAndModified(file_path, new_file_modified);

            debugger;

            if(!GetProposedFile(file_path) && !synced) {
                if(pending) {
                    if(pending.modified < new_file_modified) {                
                        AddProposedFile(null, file_path, parseInt(pending.version + 1), true); // this the newest version so add it to pending for another upload
                        sendMessage(`REGISTER_PATH:${file_path}\n`);
                    }
                } else {
                    if(!pathExcluded(file_path)) {
                        AddProposedFile(null, file_path, 1);
                        sendMessage(`REGISTER_PATH:${file_path}\n`);
                    }
                }
            }
                
        }
    });    
}


export default fileAddedHandler;