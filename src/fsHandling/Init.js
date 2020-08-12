const chokidar = require('chokidar');
const notifier = require('node-notifier');
import fileAddedHandler from './AddFile';
import fileChangedHandler from './ChangeFile';
import fileDeletedHandler from './DeleteFile';
import dirAddedHandler from './AddDir';
import dirDeletedHandler from './DeleteDir';
import { 
    GetNewPendingFiles, 
    GetPendingFiles, 
    GetUploaders, 
    RemoveUploader,
    ResetPendingFile, 
    ConfirmSyncedFileFromTransaction 
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
    // InitDB();

    const pending_files = GetNewPendingFiles();

    if(pending_files.length > 0) {
        notifier.notify({
            title: 'Evermore Datastore',
            message: `${pending_files.length} have been added to the upload queue.`
          });
    }
    

    getDownloadableFiles().then(existing_files => {
        processAllOutstandingUploads(existing_files);
        processAllPendingFiles(pending_files, existing_files);
    });    

    // setTimeout(checkPendingFilesStatus, settings.APP_CHECK_FREQUENCY * 1000);
}

const checkPendingFilesStatus = () => {
    const pending_files = GetPendingFiles();

    let confirmed_count = 0;

    for(let i in pending_files) {
        const file_info = pending_files[i];

        getTransactionStatus(file_info.tx_id).then((response) => {
            console.log(response);
            if(response.status == 404) {
                console.log(`resetting pending file ${file_info.file} as tx not found`);
                ResetPendingFile(file_info.file, file_info.modified);
            }
        });
    }

    if(confirmed_count > 0) {
        notifier.notify({
            title: 'Evermore Datastore',
            message: `${confirmed_count} files have successfully been mined and are now permanently stored on the blockchain.`
          });
    }
}

const processAllOutstandingUploads = (existing_files) => {
    return;

    const uploaders = GetUploaders();

    if(uploaders.length == 0) return;

    notifier.notify({
        title: 'Evermore Datastore',
        message: `${uploaders.length} file uploads have been resumed.`
      });

    for(let i in uploaders) {
        const already_completed = transactionExistsOnTheBlockchain(uploaders[i].transaction.id, existing_files);

        if(!already_completed) {
            finishUpload(uploaders[i]);
        } else {
            RemoveUploader(uploaders[i]);
        }        
    }

    notifier.notify({
        title: 'Evermore Datastore',
        message: `${uploaders.length} resumed file uploads have been complete.`
      });
}

const processAllPendingFiles = (pending_files, existing_files) => {
    let uploaded_count = 0;

    for(let i in pending_files) {
        const txs = fileExistsOnTheBlockchain(pending_files[i], existing_files);

        if(txs.length == 0) {
            uploadFile(pending_files[i]);
            uploaded_count++;
        } else {
            ConfirmSyncedFileFromTransaction(pending_files[i].path, txs[0]); // only send one because duplicates is dev env, shouldnt be so in production!
        }        
    }

    if(uploaded_count > 0) {
        notifier.notify({
            title: 'Evermore Datastore',
            message: `${pending_files.length} have been uploaded and will be mined sortly.`
          });
    }
    
}

const fileExistsOnTheBlockchain = (file_info, existing_files) => {
    const existing = existing_files.filter(
        tx => {
            return (file_info.file == tx.file || file_info.file == tx.path) && file_info.modified == tx.modified 
        }
    );

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