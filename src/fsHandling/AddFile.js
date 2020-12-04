import {
    AddProposedFile, 
    GetProposedFile, 
    GetDownloads, 
    GetSyncedFileBy, 
    GetExclusions,
    GetSyncedFileFromPathAndModified,
    GetDeletedFileFromPath, 
    UndeleteSyncedFile,
    AddSyncedFileFromTransaction,
    GetPendingFile,
    GetSyncedFolders
} from '../db/helpers';
import path from 'path';
// import regeneratorRuntime from "regenerator-runtime";
import {sendMessage} from '../integration/server';
import {
    getFileUpdatedDate, 
    getRalativePath, 
    createCRCFor, 
    pathExcluded
} from '../fsHandling/helpers';
import { getDownloadableFilesGQL } from '../crypto/arweave-helpers';

const fileAddedHandler = (file_path) => {
    if(file_path.endsWith('.enc') || file_path.endsWith('.DS_Store') ) return;

    const sync_folder = GetSyncedFolders()[0];

    const current_downloads = GetDownloads();
    const current_download_matches = current_downloads.filter(cd => cd.path == file_path);

    if(current_download_matches.length > 0) return;

    const new_file_modified = getFileUpdatedDate(file_path);
    const current_synced_file = GetSyncedFileBy({file: file_path.replace(sync_folder, '')});

    if(current_synced_file) {
        if(current_synced_file.modified >= new_file_modified) return; // stop because the downloader has just added this file from the blockchain
    }

    console.log(`File ${file_path} has been added`);

    const deleted_file = GetDeletedFileFromPath(file_path);

    if(deleted_file) {
        UndeleteSyncedFile(deleted_file.tx_id);
        return;
    }
    
    getDownloadableFilesGQL().then(async downloadable_files => {
        
        const relative_path = getRalativePath(file_path);
        const current_crc = await createCRCFor(file_path);

        let found_in_downloadables = false;
        let confirmed_in_blockchain = false;

        if(downloadable_files.length > 0) {
            for(let i in downloadable_files) {
                const downloadable_file = downloadable_files[i];

                if(downloadable_file.file === relative_path) {
                    if(new_file_modified > downloadable_file.modified) {
                        confirmed_in_blockchain = addProposedIfNewerThanDownloadableVersion(file_path, downloadable_file, current_crc, new_file_modified, confirmed_in_blockchain);
                    } else {
                        const sync_file = GetSyncedFileBy({file: downloadable_file.file});
                        if(sync_file) {
                            if(downloadable_file.modified == new_file_modified) {
                                sendMessage(`UNREGISTER_PATH:${file_path}\n`);
                                confirmed_in_blockchain = true;
                                continue;
                            }
                        }

                        if(downloadable_file.modified == new_file_modified) {
                            AddSyncedFileFromTransaction(downloadable_file);
                            sendMessage(`UNREGISTER_PATH:${file_path}\n`);
                            confirmed_in_blockchain = true;
                        }
                    }          
                    found_in_downloadables = true;    
                }
            }
        } 
        if(!found_in_downloadables && !confirmed_in_blockchain) {
            proposeIfOnlyFoundLocally(file_path, new_file_modified);                
        }
    });    
}


export default fileAddedHandler;

function proposeIfOnlyFoundLocally(file_path, new_file_modified) {
    const pending = GetPendingFile(file_path);
    const synced = GetSyncedFileFromPathAndModified(file_path, new_file_modified);

    if (!GetProposedFile(file_path) && !synced) {
        if (pending) {
            if (pending.modified < new_file_modified) {
                AddProposedFile(null, file_path, parseInt(pending.version + 1), true); // this the newest version so add it to pending for another upload
                sendMessage(`REGISTER_PATH:${file_path}\n`);
            }
        } else {
            const synced_file = GetSyncedFileBy({ path: file_path });
            const is_synced_file = synced_file != undefined;
            const version = is_synced_file ? synced_file.version + 1 : 1;

            if (!pathExcluded(file_path)) {
                AddProposedFile(null, file_path, version, is_synced_file);
                sendMessage(`REGISTER_PATH:${file_path}\n`);
            }
        }
    }
}

function addProposedIfNewerThanDownloadableVersion(file_path, downloadable_file, current_crc, new_file_modified, confirmed_in_blockchain) {
    if (!GetProposedFile(file_path) && !GetPendingFile(file_path)) {
        if (downloadable_file.hasOwnProperty('crc')) {
            if (downloadable_file.crc != current_crc) {
                const synced_file = GetSyncedFileFromPathAndModified(file_path, new_file_modified);

                if (!pathExcluded(file_path) && !synced_file) {
                    AddProposedFile(null, path.normalize(file_path), parseInt(downloadable_file.version + 1));
                    sendMessage(`REGISTER_PATH:${file_path}\n`);
                    confirmed_in_blockchain = true;
                }
            }
        }
    }
    return confirmed_in_blockchain;
}
