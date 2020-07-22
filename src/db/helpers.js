const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const db = null;

export function InitDB() {
    const adapter = FileSync('evermore-db.json', {
        serialize: (data) => encrypt(JSON.stringify(data)),
        deserialize: (data) => JSON.parse(decrypt(data))
    });
    db = low(adapter);
}

export const AddPendingFile = (tx_id, file) => {
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

export const ConfirmPendingFile = (tx_id) => {
    const pending = db.get('pending').find({tx_id: tx_id});

    db.get('synced_files')
        .push(pending)
        .write();
}

export const GetSyncedFiles = () => {
    return db.get('synced_files');
}

export const GetSyncedFile = (tx_id) => {
    return db.get('synced_files').find({tx_id: tx_id});
}