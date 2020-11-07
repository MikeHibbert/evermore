const chokidar = require('chokidar');
const notifier = require('node-notifier');
const path = require('path');
import fileAddedHandler from './AddFile';
import fileChangedHandler from './ChangeFile';
import fileDeletedHandler from './DeleteFile';
import dirAddedHandler from './AddDir';
import dirDeletedHandler from './DeleteDir';
import { 
    GetNewPendingFiles, 
    GetPendingFilesWithTransactionIDs, 
    GetUploaders, 
    RemoveUploader,
    ResetPendingFile, 
    ConfirmSyncedFileFromTransaction,
    GetSyncStatus,
    GetSyncFrequency,
    GetAllProposedFiles, 
    GetProposedFile,
    GetProposedFileBy,
    GetSyncedFolders,
    AddPendingFile,
    RemoveProposedFile
} from '../db/helpers';
import { 
    uploadFile, 
    finishUpload, 
    getTransactionStatus, 
    getDownloadableFilesGQL,
    transactionExistsOnTheBlockchain,
    fileExistsOnTheBlockchain,
    getTransactionWithTags
} from '../crypto/arweave-helpers';
import {convertProposedToInfos, getSystemPath} from './helpers';
import openSyncSettingsDialog, {refreshSyncSettingsDialog} from '../ui/SyncSettingsDialog';
import { settings } from '../config';
import { sendMessage } from '../integration/server';
import { nextTick } from 'process';

export const OnFileWatcherReady = () => {
    console.log('Initial scan complete. Ready for changes');

    const pending_files = GetNewPendingFiles();

    if(pending_files.length > 0) {
        notifier.notify({
            title: 'Evermore Datastore',
            icon: settings.NOTIFY_ICON_PATH,
            message: `${pending_files.length} have been added to the upload queue.`
        });
    }

    const syncing = GetSyncStatus();
    if(syncing) {
        startSyncProcessing();
    }  

    startPendingTrasactionConfirmation();
}

let pending_transaction_confirmation_checking_interval = null
const startPendingTrasactionConfirmation = () => {
    const pending_files = GetNewPendingFiles();

    if(pending_files.length > 0) {
        processAllPendingTransactions(pending_files);
    }

    pending_transaction_confirmation_checking_interval = setInterval(() => {
        const pending_files = GetPendingFilesWithTransactionIDs();

        if(pending_files.length > 0) {
            processAllPendingTransactions(pending_files);
        }
    }, 1 * 60 * 1000); // check them every 10 mins
}

const processAll = () => {
    checkPendingFilesStatus();
    processAllOutstandingUploads();
}

let sync_processing_interval = null;
export const startSyncProcessing = () => {
    processAll();

    sync_processing_interval = setInterval(() => {
        processAll();
    }, GetSyncFrequency() * 60 * 1000);
}


export const stopSyncProcessing = () => {
    if(sync_processing_interval) {
        clearInterval(sync_processing_interval);
    }
}

export const unpauseSyncProcessing = () => {
    sync_processing_interval = setInterval(() => {
        processAll();
    }, GetSyncFrequency() * 60 * 1000);
}


export const pauseSyncProcessing = () => {
    if(sync_processing_interval) {
        clearInterval(sync_processing_interval);
    }
}

const checkPendingFilesStatus = () => {
    const pending_files = GetPendingFilesWithTransactionIDs();

    let confirmed_count = 0;

    for(let i in pending_files) {
        const file_info = pending_files[i];

        getTransactionStatus(file_info.tx_id).then((response) => {
            if(response.status == 404) {
                console.log(`resetting pending file ${file_info.file} as it was not found on the blockchain`);
                ResetPendingFile(file_info.file, file_info.modified);
            }

            if(response.status == 200) {
                ConfirmSyncedFileFromTransaction(file_info.file, file_info.tx_id);
                confirmed_count++;
            }
        });
    }

    if(confirmed_count > 0) {
        notifier.notify({
            title: 'Evermore Datastore',
            icon: settings.NOTIFY_ICON_PATH,
            message: `${confirmed_count} files have successfully been mined and are now permanently stored on the blockchain.`            
        });
    }
}

const processAllOutstandingUploads = async () => {
    const uploaders = GetUploaders();

    for(let i in uploaders) {
        const uploader_record = uploaders[i];
        const already_completed = await transactionExistsOnTheBlockchain(uploader_record.uploader.transaction.id);

        if(!already_completed) {
            const twenty_minutes_ago = new Date();
            twenty_minutes_ago.setMinutes(new Date().getMinutes() - 20);

            if(uploader_record.created < twenty_minutes_ago.getTime()) {
                pauseSyncProcessing();

                finishUpload(uploader_record.uploader);

                RemoveUploader(uploader_record);

                unpauseSyncProcessing();
            }
            
        } else {
            RemoveUploader(uploader_record);
        }        
    }

    // if(uploaders.length > 0) {
    //     notifier.notify({
    //         title: 'Evermore Datastore',
    //         icon: settings.NOTIFY_ICON_PATH,
    //         message: `${uploaders.length} resumed file uploads have been complete.`
    //     });
    // }
    
    const syncable_files = getAllSyncableFiles();

    if(syncable_files.length > 0) {
        const minutes = GetSyncFrequency();
        notifier.notify({
            title: 'Evermore Datastore',
            icon: settings.NOTIFY_ICON_PATH,
            message: `${syncable_files.length} files have been queued for sync in the last ${minutes} minutes. Would like to review them now?`,
            actions: ['Review', 'Postpone']
        });

        notifier.on('review', () => {
            prepareProposedFiles(syncable_files);
        });

        notifier.on('postpone', () => {
            // console.log('"Postpone" was pressed');
        });
    }

    const pending_files = GetNewPendingFiles();

    if(pending_files.length > 0) {
        processAllPendingFiles(pending_files);
    }
}

const getAllSyncableFiles = () => {
    const proposed_files = GetAllProposedFiles();
    proposed_files.forEach(pf => {
        pf['action'] = 'upload';
    });
    const downloadable_files = getDownloadableFilesGQL();


}

let sync_settings_dialog_open = false;
const prepareProposedFiles = (proposed_files) => {
    const sync_folders = GetSyncedFolders();

    const path_infos = convertProposedToInfos(sync_folders[0], proposed_files, true);

    pauseSyncProcessing();

    if(sync_settings_dialog_open) {
        refreshSyncSettingsDialog(path_infos[''], (path_infos_to_be_synced) => {
            addPathInfosToPending(path_infos_to_be_synced);

            const pending_files = GetNewPendingFiles();

            processAllPendingFiles(pending_files);

            unpauseSyncProcessing();
            sync_settings_dialog_open = false;
        },
        () => {
            unpauseSyncProcessing();
            sync_settings_dialog_open = false;
        });
    } else {
        sync_settings_dialog_open = true;
        openSyncSettingsDialog(path_infos[''], (path_infos_to_be_synced) => {
            addPathInfosToPending(path_infos_to_be_synced);

            const pending_files = GetNewPendingFiles();

            processAllPendingFiles(pending_files);

            unpauseSyncProcessing();
            sync_settings_dialog_open = false;
        },
        () => {
            unpauseSyncProcessing();
            sync_settings_dialog_open = false;
        });
    }
    
}

const addPathInfosToPending = (path_infos) => {
    const sync_folders = GetSyncedFolders();
    const sync_folder = sync_folders[0];

    for(let i in path_infos.children) {
        const pa = path_infos.children[i];

        if(pa.type == 'folder') {
            addPathInfosToPending(pa);
        } else {
            if(pa.checked) {
                const proposed_file = GetProposedFileBy({file: pa.path});
                AddPendingFile(null, pa.path, proposed_file.version, proposed_file.is_update);
                RemoveProposedFile(path.join(path.normalize(sync_folder), pa.path));
            }            
        }
    }
}

const processAllPendingFiles = async (pending_files) => {
    let uploaded_count = 0;

    const public_sync_folder = path.join(getSystemPath(), 'Public');

    for(let i in pending_files) {
        const txs = await fileExistsOnTheBlockchain(pending_files[i]);

        if(txs.length == 0) {
            const encrypt_file = pending_files[i].path.indexOf(public_sync_folder) == -1;

            pauseSyncProcessing()

            uploadFile(pending_files[i], encrypt_file);

            unpauseSyncProcessing();

            uploaded_count++;
        }       
    }

    if(uploaded_count > 0) {
        notifier.notify({
            title: 'Evermore',
            icon: settings.NOTIFY_ICON_PATH,
            message: `${pending_files.length} have been uploaded and will be mined sortly.`
        });
    }     
}

const processAllPendingTransactions = async (pending_files) => {
    let confirmed_count = 0;

    const public_sync_folder = path.join(getSystemPath(), 'Public');

    for(let i in pending_files) {
        if(!pending_files[i].tx_id) continue;

        const exists_on_the_blockchain = await transactionExistsOnTheBlockchain(pending_files[i].tx_id);

        if(exists_on_the_blockchain) {
            const transaction = await getTransactionWithTags(pending_files[i].tx_id);
            
            ConfirmSyncedFileFromTransaction(pending_files[i].path, transaction);
            
            sendMessage(`UNREGISTER_PATH:${pending_files[i].path}\n`);

            confirmed_count++;
        }       
    }

    if(confirmed_count > 0) {
        notifier.notify({
            title: 'Evermore',
            icon: settings.NOTIFY_ICON_PATH,
            message: `${confirmed_count} have been successfully mined and are available on the blockchain.`
        });
    } 
}

export const InitFileWatcher = (sync_folders) => {
    chokidar.watch(sync_folders)
    .on('add', path => fileAddedHandler(path))
    .on('change', path => fileChangedHandler(path))
    .on('unlink', path => fileDeletedHandler(path))
    .on('addDir', path => dirAddedHandler(path))
    .on('unlinkDir', path => dirDeletedHandler(path))
    .on('error', error => log(`Watcher error: ${error}`))
    .on('ready', () => OnFileWatcherReady());
}