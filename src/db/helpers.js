import {getFileUpdatedDate} from '../fsHandling/helpers';
const low = require('lowdb');
const os = require('os');
const FileSync = require('lowdb/adapters/FileSync');
import {settings} from '../config';

let db = null;

function getDB() {
    const adapter = new FileSync(settings.DB_PATH);
    db = low(adapter);

    return db;
}

export function InitDB() {
    db = getDB();

    const sync_status = db.has('sync_status').value();
    if(sync_status === false) {
        db.set('sync_status', false).write();
    }

    const sync_frequency = db.has('sync_frequency').value();
    if(sync_frequency === false) {
        db.set('sync_frequency', 10 * 60 * 100).write(); // default to every 10 mins
    }

    const pending = db.has('pending').value();
    if(pending === false) {
        db.set('pending', []).write();
    }

    const synced_files = db.has('synced_files').value();
    if(synced_files === false) {
        db.set('synced_files', []).write();
    }

    const folders = db.has('folders').value();
    if(folders === false) {
        db.set('folders', []).write();
    }

    const sync_folders = db.has('sync_folders').value();
    if(sync_folders === false) {
        db.set('sync_folders', []).write();
    }

    const wallet_file = db.has('wallet_file').value();
    if(wallet_file === false) {
        db.set('wallet_file', '').write();
    }

    const uploaders = db.has('uploaders').value();
    if(uploaders === false) {
        db.set('uploaders', []).write();
    }

    const downloads = db.has('downloads').value();
    if(downloads === false) {
        db.set('downloads', []).write();
    }
}

export const GetSyncStatus = () => {
    return db.get('sync_status').value();
}

export const SetSyncStatus = (paused) =>  {
    if(!db) {
        InitDB();
    }
    
    db.set('sync_status', paused).write();
}

export const GetSyncFrequency = () => {
    return db.get('sync_frequency').value();
}

export const SetSyncFrequency = (minutes) =>  {
    if(!db) {
        InitDB();
    }
    
    db.set('sync_frequency', minutes * 60 * 1000).write();
}

export const walletFileSet = () => {
    if(!db) {
        InitDB();
    }

    return db.get('wallet_file').value();
}

export const setWalletFilePath = (path) => {
    if(!db) {
        InitDB();
    }

    db.set('wallet_file', path).write();
}

export const resetWalletFilePath = () => {
    if(!db) {
        InitDB();
    }

    db.unset('wallet_file').write();
}

export const AddPendingFile = (tx_id, file, version) => {
    const sync_folders = GetSyncedFolders();

    let relative_path = file;

    for(let i in sync_folders) {
        const sync_folder = sync_folders[i];
        if(file.indexOf(sync_folder) != -1) {
            relative_path = file.replace(sync_folder, '');
        }
    }

    if(GetPendingFile(relative_path)) return;

    if(!db) {
        InitDB();
    }

    db.get('pending')
        .push({
            tx_id: tx_id,
            file: relative_path,
            path: file,
            version: version,
            modified: getFileUpdatedDate(file),
            hostname: os.hostname()
        }).write();
}

export const UpdatePendingFileTransactionID = (file, tx_id) => {
    if(!db) {
        InitDB();
    }

    db.get('pending')
        .find({file: file})
        .assign({tx_id: tx_id})
        .write();
}

export const ResetPendingFile = (file, modified) => {
    if(!db) {
        InitDB();
    }

    db.get('pending')
        .find({file: file})
        .assign({tx_id: null, modified: modified})
        .write();

    return db.get('pending').find({file: file}).value();
}

export const RemovePendingFile = (path) => {
    if(!db) {
        InitDB();
    }

    db.get('pending')
        .remove({
            path: path
        }).write();
}

export const GetNewPendingFiles = () => {
    if(!db) {
        InitDB();
    }

    return db.get('pending')
        .value()
        .filter((file_info) => file_info.tx_id == null);
}

export const GetPendingFiles = () => {
    if(!db) {
        InitDB();
    }

    return db.get('pending')
        .value()
        .filter((file_info) => file_info.tx_id != null);
}

export const GetNewOrPendingFile = () => {
    if(!db) {
        InitDB();
    }

    return db.get('pending')
        .value();
}

export const GetAllPendingFiles = () => {
    if(!db) {
        InitDB();
    }

    return db.get('pending')
        .value();
}

export const GetPendingFile = (path) => {
    if(!db) {
        InitDB();
    }

    const file = db.get('pending').find({path: path}).value();

    if(file) {
        const modified = getFileUpdatedDate(file.path);
        if(modified > file.modified) {
            return ResetPendingFile(file.file, modified);
        }
    }
    return file;
}

export const ConfirmSyncedFile = (tx_id) => {
    if(!db) {
        InitDB();
    }

    const pending = db.get('pending').find({tx_id: tx_id}).value();

    db.get('synced_files')
        .push(pending)
        .write();

    db.get('pending').remove({tx_id: tx_id}).write();
}

export const ConfirmSyncedFileFromTransaction = (path, transaction) => {
    if(!db) {
        InitDB();
    }

    if(GetSyncedFileFromPath(path)) {
        return;
    }
    
    db.get('synced_files')
        .push({
            tx_id: transaction.id,
            file: transaction.file,
            path: path,
            version: transaction.version == undefined ? 1 : transaction.version,
            modified: transaction.modified,
            hostname: transaction.hostname
        })
        .write();

    db.get('pending').remove({tx_id: transaction.id}).write();
}

export const GetSyncedFiles = () => {
    if(!db) {
        InitDB();
    }

    return db.get('synced_files').value();
}

export const GetSyncedFile = (tx_id) => {
    if(!db) {
        InitDB();
    }

    return db.get('synced_files').find({tx_id: tx_id}).value();
}

export const GetSyncedFileFromPath = (path) => {
    if(!db) {
        InitDB();
    }

    return db.get('synced_files').find({path: path}).value();
}

export const AddFileToDownloads = (file_info) => {
    if(!db) {
        InitDB();
    }

    db.get('downloads')
        .push(file_info).write();
}

export const RemoveFileFromDownloads  = (name, path) => {
    if(!db) {
        InitDB();
    }

    db.get('downloads')
        .remove({
            name: name,
            path: path
        }).write();
}

export const GetDownloads = () => {
    if(!db) {
        InitDB();
    }

    return db.get('downloads').value();
}

export const AddFolder = (tx_id, path) => {
    if(!db) {
        InitDB();
    }

    console.log(path);

    if(GetFolder(tx_id)) return;

    db.get('folders')
        .push({
            tx_id: tx_id,
            path: path,
            modified: getFileUpdatedDate(path)
        }).write();
}

export const RemoveFolder = (tx_id) => {
    if(!db) {
        InitDB();
    }

    db.get('folders')
        .remove({
            tx_id: tx_id
        }).write();
}

export const GetFolders = () => {
    if(!db) {
        InitDB();
    }

    return db.get('folders');
}

export const GetFolder = (tx_id) => {
    if(!db) {
        InitDB();
    }

    return db.get('folders').find({tx_id: tx_id}).value();
}

export const AddSyncedFolder = (path) => {
    if(!db) {
        InitDB();
    }

    db.get('sync_folders')
        .push({
            path: path
        }).write();
}

export const RemoveSyncedFolder = (path) => {
    if(!db) {
        InitDB();
    }

    db.get('sync_folders')
        .remove({
            path: path
        }).write();
}

export const GetSyncedFolders = () => {
    if(!db) {
        InitDB();
    }

    return db.get('sync_folders').map('path').value();
}

export const GetSyncedFolder = (tx_id) => {
    if(!db) {
        InitDB();
    }

    return db.get('sync_folders').find({path: path}).value();
}

export const SaveUploader = (uploader) => {
    if(!db) {
        InitDB();
    }

    db.get('uploaders')
        .push(JSON.stringify(uploader)).write();
}

export const GetUploaders = () => {
    if(!db) {
        InitDB();
    }

    return db.get('uploaders').value();
}

export const RemoveUploader = (uploader) => {
    if(!db) {
        InitDB();
    }

    db.get('uploaders')
        .remove(uploader).write();
}