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

export const AddPendingFile = (file) => {

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