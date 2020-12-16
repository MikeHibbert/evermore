import {getFileUpdatedDate} from '../fsHandling/helpers';
const low = require('lowdb');
const os = require('os');
const fs = require('fs');
const path = require('path');
const FileSync = require('lowdb/adapters/FileSync');
import {settings} from '../config';
import {startSyncProcessing, stopSyncProcessing} from '../fsHandling/Init';
import {normalizePath, denormalizePath} from '../fsHandling/helpers';

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
        db.set('sync_status', true).write();
    }

    const sync_frequency = db.has('sync_frequency').value();
    if(sync_frequency === false) {
        db.set('sync_frequency', 10).write(); // default to every 10 mins
    }

    const proposed = db.has('proposed').value();
    if(proposed === false) {
        db.set('proposed', []).write();
    }

    const pending = db.has('pending').value();
    if(pending === false) {
        db.set('pending', []).write();
    }

    const deleting = db.has('deleting').value();
    if(deleting === false) {
        db.set('deleting', []).write();
    }

    const deleted = db.has('deleted').value();
    if(deleted === false) {
        db.set('deleted', []).write();
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

    const exclusions = db.has('exclusions').value();
    if(exclusions === false) {
        db.set('exclusions', '{"":{"index":-1,"id":"root","type":"folder","name":"","children":[]}}').write();
    }
}

export const GetSyncStatus = () => {
    return db.get('sync_status').value();
}

export const SetSyncStatus = (syncing) =>  {
    if(!db) {
        InitDB();
    }

    if(syncing) {
        startSyncProcessing();
    } else {
        stopSyncProcessing();
    }
    
    db.set('sync_status', syncing).write();
}

export const GetSyncFrequency = () => {
    return db.get('sync_frequency').value();
}

export const SetSyncFrequency = (minutes) =>  {
    if(!db) {
        InitDB();
    }

    const syncing = GetSyncStatus();
    if(syncing) {
        stopSyncProcessing();
    }
    
    db.set('sync_frequency', minutes).write();

    if(syncing) {
        startSyncProcessing();
    }
    
}

export const walletFileSet = () => {
    if(!db) {
        InitDB();
    }

    return db.get('wallet_file').value();
}

export const setWalletFilePath = (file_path) => {
    if(!db) {
        InitDB();
    }

    db.set('wallet_file', file_path).write();
}

export const resetWalletFilePath = () => {
    if(!db) {
        InitDB();
    }

    db.unset('wallet_file').write();
}

export const AddPendingFile = (tx_id, file_path, version, is_update=false) => {
    if(!db) {
        InitDB();
    }

    const sync_folders = GetSyncedFolders();

    let relative_path = file_path;

    for(let i in sync_folders) {
        const sync_folder = sync_folders[i];
        if(file_path.indexOf(sync_folder) != -1) {
            relative_path = file_path.replace(sync_folder, '');
        }
    }

    const denormalized_path = denormalizePath(file_path);

    if(fs.lstatSync(denormalized_path).isDirectory()) return;

    if(GetPendingFile(file_path)) return;    

    db.get('pending')
        .push({
            tx_id: tx_id,
            file: relative_path,
            path: file_path,
            version: version,
            modified: getFileUpdatedDate(denormalized_path),
            hostname: os.hostname(),
            is_update: is_update // are we updating an existing file with new data?
        }).write();
}

export const UpdatePendingFileTransactionID = (file_path, tx_id) => {
    if(!db) {
        InitDB();
    }

    db.get('pending')
        .find({path: file_path})
        .assign({tx_id: tx_id})
        .write();
}

export const ResetPendingFile = (file_path, modified) => {
    if(!db) {
        InitDB();
    }

    db.get('pending')
        .find({path: file_path})
        .assign({tx_id: null, modified: modified})
        .write();

    return db.get('pending').find({path: file_path}).value();
}

export const RemovePendingFile = (file_path) => {
    if(!db) {
        InitDB();
    }

    db.get('pending')
        .remove({
            path: file_path
        }).write();
}

export const GetNewPendingFiles = () => {
    if(!db) {
        InitDB();
    }

    const pending = db.get('pending').value();

    return pending.filter((file_info) => file_info.tx_id == null);
}

export const GetPendingFilesWithTransactionIDs = () => {
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

export const GetPendingFile = (file_path) => {
    if(!db) {
        InitDB();
    }

    const file = db.get('pending').find({path: file_path}).value();

    // if(file) {
    //     const modified = getFileUpdatedDate(file_path);
    //     if(modified > file.modified && file.tx_id == null) {
    //         return ResetPendingFile(file.file, modified);
    //     }
    // }
    return file;
}

export const AddProposedFile = (tx_id, file_path, version, is_update) => {
    if(!db) {
        InitDB();
    }

    const sync_folders = GetSyncedFolders();

    let relative_path = file_path;

    for(let i in sync_folders) {
        const sync_folder = sync_folders[i];
        if(file_path.indexOf(sync_folder) != -1) {
            relative_path = file_path.replace(sync_folder, '');
        }
    }

    relative_path = normalizePath(relative_path);

    if(GetProposedFile(relative_path)) return;

    const denormalized_path = denormalizePath(file_path);
    const full_path = denormalized_path.indexOf(sync_folders[0]) != -1 ? denormalized_path : path.join(sync_folders[0], denormalized_path);

    db.get('proposed')
        .push({
            tx_id: tx_id,
            file: relative_path,
            path: relative_path,
            version: version,
            modified: getFileUpdatedDate(full_path),
            hostname: os.hostname(),
            is_update: is_update
        }).write();
}

export const GetProposedFile = (file_path) => {
    if(!db) {
        InitDB();
    }

    const sync_folders = GetSyncedFolders();

    const file = db.get('proposed').find({path: file_path}).value();

    if(file) {
        const denormalized_path = denormalizePath(file_path);
        const full_path = denormalized_path.indexOf(sync_folders[0]) != -1 ? denormalized_path : path.join(sync_folders[0], denormalized_path);

        const modified = getFileUpdatedDate(full_path);
        if(modified > file.modified) {
            return ResetProposedFile(file.path, modified);
        }
    }
    return file;
}

export const GetProposedFileBy = (query) => {
    if(!db) {
        InitDB();
    }

    const file = db.get('proposed').find(query).value();

    // if(file) {
    //     const modified = getFileUpdatedDate(file.path);
    //     if(modified > file.modified) {
    //         return ResetProposedFile(file.file, modified);
    //     }
    // }
    return file;
}

export const ResetProposedFile = (file_path, modified) => {
    if(!db) {
        InitDB();
    }

    db.get('proposed')
        .find({file: file_path})
        .assign({tx_id: null, modified: modified})
        .write();

    return db.get('proposed').find({file: file_path}).value();
}

export const RemoveProposedFile = (file_path) => {
    if(!db) {
        InitDB();
    }

    db.get('proposed')
        .remove({
            path: file_path
        }).write();
}

export const RemoveProposedFileBy = (query) => {
    if(!db) {
        InitDB();
    }

    db.get('proposed')
        .remove(query).write();
}

export const GetAllProposedFiles = () => {
    if(!db) {
        InitDB();
    }

    let proposed = db.get('proposed').value();

    proposed.forEach(pf => { // sanity check them as the downloader may have triggered the AddFile system
        const synced_file = GetSyncedFileBy({file: pf.file});

        if(synced_file) {
            if(synced_file.modified == pf.modified) {
                RemoveProposedFile(pf.file);
            }
        }
    });

    return db.get('proposed').value(); // get them again now they have been cleaned up
}

export const ConfirmSyncedFile = (tx_id) => {
    if(!db) {
        InitDB();
    }

    const pending = db.get('pending').find({tx_id: tx_id}).value();


    if(pending.is_update) {
        UpdateSyncedFile(pending.file, pending.tx_id, pending.version, pending.modified)
    } else {
        db.get('synced_files')
            .push(pending)
            .write();
    }    

    db.get('pending').remove({tx_id: tx_id}).write();
}

export const UpdateSyncedFile = (file_path, tx_id, version, modified) => {
    if(!db) {
        InitDB();
    }

    db.get('synced_files')
        .find({path: file_path})
        .assign({tx_id: tx_id, version: version, modified: modified})
        .write();
}

export const AddSyncedFileFromTransaction = (transaction) => {
    if(!db) {
        InitDB();
    }

    if(transaction.hasOwnProperty('tags')) {
        delete transaction.tags;
    }

    db.get('synced_files')
        .push(transaction)
        .write();
}

export const ConfirmSyncedFileFromTransaction = (file_path, transaction) => {
    if(!db) {
        InitDB();
    }

    const pending = db.get('pending').find({tx_id: transaction.id}).value();

    
    
    if(pending) {
        if(pending.is_update) {
            UpdateSyncedFile(pending.path, pending.tx_id, parseInt(pending.version), pending.modified);
        } else {
            db.get('synced_files')
                .push({
                    tx_id: transaction.id,
                    file: transaction.file,
                    path: file_path,
                    version: transaction.version,
                    modified: transaction.modified,
                    hostname: transaction.hostname,
                    crc: transaction.CRC
                })
                .write();
        }  
    } else {
        UpdateSyncedFile(transaction.file, transaction.id, transaction.version, transaction.modified);
    }
    
    
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

export const GetSyncedFileBy = (query) => {
    if(!db) {
        InitDB();
    }

    return db.get('synced_files').find(query).value();
}

export const GetSyncedFileFromPath = (path) => {
    if(!db) {
        InitDB();
    }

    return db.get('synced_files').find({path: path}).value();
}

export const GetSyncedFileFromPathAndModified = (file_path, modified) => {
    if(!db) {
        InitDB();
    }

    const results = db.get('synced_files').find({path: file_path, modified: modified}).value();
;
    return results;
}

export const DeleteSyncedFile = (tx_id) => {
    if(!db) {
        InitDB();
    }

    const synced_file = db.get('synced_files').find({tx_id: tx_id}).value();
    
    db.get('deleting')
            .push(synced_file)
            .write();   

    db.get('synced_files').remove({tx_id: tx_id}).write();
}

export const UndeleteSyncedFile = (tx_id) => {
    if(!db) {
        InitDB();
    }

    const synced_file = db.get('deleting').find({tx_id: tx_id}).value();

    

    db.get('synced_files')
            .push(synced_file)
            .write();   

    db.get('deleting').remove({tx_id: tx_id}).write();
}

export const ConfirmDeletedFile = (tx_id) => {
    if(!db) {
        InitDB();
    }

    const file_to_delete = db.get('deleting').find({tx_id: tx_id}).value();

    // file_to_delete['action_tx_id'] = null;
    
    db.get('deleted')
            .push(file_to_delete)
            .write();   

    db.get('deleting').remove({tx_id: tx_id}).write();
}

export const UpdatePersistenceID = (file, tx_id) => {
    if(!db) {
        InitDB();
    }

    db.get('deleted')
        .find({file: file})
        .assign({action_tx_id: tx_id})
        .write();
}

export const RemovePersistenceRecord = (action_tx_id) => {
    if(!db) {
        InitDB();
    }  

    db.get('deleted').remove({action_tx_id: action_tx_id}).write();
}

export const GetDeletedFileFromPath = (path) => {
    if(!db) {
        InitDB();
    }

    return db.get('deleting').find({path: path}).value();
}

export const GetDeletingFiles = () => {
    if(!db) {
        InitDB();
    }

    return db.get('deleting').value();
}

export const GetDeletedFiles = () => {
    if(!db) {
        InitDB();
    }

    return db.get('deleted').value();
}

export const AddFileToDownloads = (file_info) => {
    if(!db) {
        InitDB();
    }

    db.get('downloads')
        .push(file_info).write();
}

export const RemoveFileFromDownloads  = (path) => {
    if(!db) {
        InitDB();
    }

    db.get('downloads')
        .remove({
            path: path
        }).write();
}

export const GetDownloads = () => {
    if(!db) {
        InitDB();
    }

    return db.get('downloads').value();
}

export const InDownloadQueue = (file_info) => {
    const download = db.get('downloads')
    .find({path: file_info.path, tx_id: file_info.tx_id}).value();

    return download != undefined;
}

export const UpdateExclusions = (exclusions_file_infos) => {
    if(!db) {
        InitDB();
    }

    db.unset('exclusions').write();

    db.set('exclusions', JSON.stringify(exclusions_file_infos)).write();
}


export const GetExclusions = () => {
    if(!db) {
        InitDB();
    }

    return JSON.parse(db.get('exclusions').value());
}

export const AddFolder = (tx_id, folder_path) => {
    if(!db) {
        InitDB();
    }

    console.log(folder_path);

    if(GetFolder(tx_id)) return;

    db.get('folders')
        .push({
            tx_id: tx_id,
            path: folder_path,
            modified: getFileUpdatedDate(folder_path)
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

    const sync_folders = db.get('sync_folders').map('path').value().map(sync_folder => { 
        return process.platform == "win32" ? sync_folder.split('/').join('\\') : sync_folder;
    });

    return sync_folders;
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

    const uploader_record = {
        created: new Date().getTime(),
        uploader: uploader
    }

    db.get('uploaders')
        .push(uploader_record).write();

    return uploader_record;
}

export const GetUploaders = () => {
    if(!db) {
        InitDB();
    }

    return db.get('uploaders').value();
}

export const RemoveUploader = (uploader_record) => {
    if(!db) {
        InitDB();
    }

    const query = {created: uploader_record.created};

    db.get('uploaders')
        .remove(query).write();
}