const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

let db = null;

export function InitDB() {
    const adapter = new FileSync('evermore-db.json');
    db = low(adapter);

    debugger;

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
}

export const AddPendingFile = (tx_id, file) => {
    console.log(file);

    if(GetPendingFile(tx_id)) return;

    db.get('pending')
        .push({
            tx_id: tx_id,
            file: file
        }).write();
}

export const RemovePendingFile = (tx_id) => {
    db.get('pending')
        .remove({
            tx_id: tx_id
        }).write();
}

export const GetPendingFiles = () => {
    return db.get('pending');
}

export const GetPendingFile = (tx_id) => {
    return db.get('pending').find({tx_id: tx_id});
}

export const ConfirmSyncedFile = (tx_id) => {
    const pending = db.get('pending').find({tx_id: tx_id});

    db.get('synced_files')
        .push(pending)
        .write();

    db.get('pending').remove({tx_id: tx_id}).write();
}

export const GetSyncedFiles = () => {
    return db.get('synced_files');
}

export const GetSyncedFile = (tx_id) => {
    return db.get('synced_files').find({tx_id: tx_id});
}

export const AddFolder = (tx_id, file) => {
    console.log(file);

    if(GetFolder(tx_id)) return;

    db.get('folders')
        .push({
            tx_id: tx_id,
            file: file
        }).write();
}

export const RemoveFolder = (tx_id) => {
    db.get('folders')
        .remove({
            tx_id: tx_id
        }).write();
}

export const GetFolders = () => {
    return db.get('folders');
}

export const GetFolder = (tx_id) => {
    return db.get('folders').find({tx_id: tx_id});
}