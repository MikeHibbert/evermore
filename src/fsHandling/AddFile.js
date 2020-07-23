
import {AddPendingFile, GetPendingFile, GetSyncedFile } from '../db/helpers';
const shortid = require('shortid')

const fileAddedHandler = (path) => {
    console.log(`File ${path} has been added`)

    const tx_id = shortid.generate();

    if(!GetPendingFile(tx_id)) {
        AddPendingFile(tx_id, path);
    }
}

export default fileAddedHandler;