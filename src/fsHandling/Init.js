const chokidar = require('chokidar');
const notifier = require('node-notifier');
import fileAddedHandler from './AddFile';
import fileChangedHandler from './ChangeFile';
import fileDeletedHandler from './DeleteFile';
import dirAddedHandler from './AddDir';
import dirDeletedHandler from './DeleteDir';
import { GetPendingFiles } from '../db/helpers';
import { uploadFile } from '../crypto/arweave-helpers';

export const OnFileWatcherReady = () => {
    console.log('Initial scan complete. Ready for changes');
    // InitDB();

    const pending_files = GetPendingFiles();

    notifier.notify({
        title: 'Evermore Datastore',
        message: `${pending_files.length} have been added to the upload queue.`
      });

    processAllOutstandingUploads();
    processAllPendingFiles(pending_files);


}

const processAllOutstandingUploads = () => {

}

const processAllPendingFiles = (pending_files) => {
    for(let i in pending_files) {
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