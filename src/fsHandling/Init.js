const chokidar = require('chokidar');
const notifier = require('node-notifier');
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
    walletFileSet, GetSyncedFolders
} from '../db/helpers';
import { 
    uploadFile, 
    finishUpload, 
    getTransactionStatus, 
    getDownloadableFiles 
} from '../crypto/arweave-helpers';
import { settings } from '../config';

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
        processAll();
        startSyncProcessing();
    }  
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

const checkPendingFilesStatus = () => {
    const pending_files = GetPendingFilesWithTransactionIDs();

    let confirmed_count = 0;

    for(let i in pending_files) {
        const file_info = pending_files[i];

        getTransactionStatus(file_info.tx_id).then((response) => {
            console.log(response);
            if(response.status == 404) {
                console.log(`resetting pending file ${file_info.file} as it was not found on the blcokchain`);
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

const processAllOutstandingUploads = (existing_files) => {
    const uploaders = GetUploaders();

    for(let i in uploaders) {
        const already_completed = transactionExistsOnTheBlockchain(uploaders[i].transaction.id, existing_files);

        if(!already_completed) {
            finishUpload(uploaders[i]);
        } else {
            RemoveUploader(uploaders[i]);
        }        
    }

    if(uploaders.length > 0) {
        notifier.notify({
            title: 'Evermore Datastore',
            icon: settings.NOTIFY_ICON_PATH,
            message: `${uploaders.length} resumed file uploads have been complete.`
        });
    }
    
    const pending_files = GetNewPendingFiles();

    if(pending_files.length > 0) {
        const minutes = settings.APP_CHECK_FREQUENCY / 60;
        notifier.notify({
            title: 'Evermore Datastore',
            icon: settings.NOTIFY_ICON_PATH,
            message: `${pending_files.length} files have been queued for upload in the last ${minutes} minutes. Would like to review them now?`,
            actions: ['Review', 'Postpone']
        });

        notifier.on('review', () => {
            preparePendingFiles(pending_files);
        });

        notifier.on('postpone', () => {
            console.log('"Postpone" was pressed');
        });
    }
}

const preparePendingFiles = (pending_files) => {
    console.log(pending_files.length);
}

const processAllPendingFiles = (pending_files, existing_files) => {
    let uploaded_count = 0;

    const public_sync_folder = path.join(getSystemPath(), 'Public');

    if(GetSyncStatus() != false) {
        for(let i in pending_files) {
            const txs = fileExistsOnTheBlockchain(pending_files[i], existing_files);
    
            if(txs.length == 0) {
                const encrypt_file = pending_files[i].path.indexOf(public_sync_folder) != -1;
                uploadFile(pending_files[i], encrypt_file);
                uploaded_count++;
            } else {
                // only send one because duplicates is dev env, shouldnt be so in production!
                ConfirmSyncedFileFromTransaction(pending_files[i].path, txs[0]); 
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
    
}

const fileExistsOnTheBlockchain = (file_info, existing_files) => {
    const existing = existing_files.filter(
        tx => {
            return (file_info.file == tx.file || file_info.file == tx.path) && file_info.modified == tx.modified 
        }
    );

    debugger;

    return existing;
}

const transactionExistsOnTheBlockchain = (tx_id, existing_files) => {
    const existing = existing_files.filter(
        tx => { return tx.id == tx_id }
    );

    return existing.length > 0;
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