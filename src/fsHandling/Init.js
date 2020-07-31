const chokidar = require('chokidar');
const notifier = require('node-notifier');
import fileAddedHandler from './AddFile';
import fileChangedHandler from './ChangeFile';
import fileDeletedHandler from './DeleteFile';
import dirAddedHandler from './AddDir';
import dirDeletedHandler from './DeleteDir';
import { GetNewPendingFiles, GetPendingFiles, GetUploaders, ResetPendingFile } from '../db/helpers';
import { uploadFile, finishUpload, getTransactionStatus } from '../crypto/arweave-helpers';

export const OnFileWatcherReady = () => {
    console.log('Initial scan complete. Ready for changes');
    // InitDB();

    const pending_files = GetNewPendingFiles();

    notifier.notify({
        title: 'Evermore Datastore',
        message: `${pending_files.length} have been added to the upload queue.`
      });

    processAllOutstandingUploads();
    processAllPendingFiles(pending_files);

    setTimeout(checkPendingFilesStatus, 30 * 1000);
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

const processAllOutstandingUploads = () => {
    const uploaders = GetUploaders();

    if(uploaders.length == 0) return;

    notifier.notify({
        title: 'Evermore Datastore',
        message: `${uploaders.length} file uploads have been resumed.`
      });

    for(let i in uploaders) {
        debugger;
        finishUpload(uploaders[i]);
    }

    notifier.notify({
        title: 'Evermore Datastore',
        message: `${uploaders.length} resumed file uploads have been complete.`
      });
}

const processAllPendingFiles = (pending_files) => {
    for(let i in pending_files) {
        debugger;
        uploadFile(pending_files[i]);
    }

    notifier.notify({
        title: 'Evermore Datastore',
        message: `${pending_files.length} have been uploaded and will be mined sortly.`
      });
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