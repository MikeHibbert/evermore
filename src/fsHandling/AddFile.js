import {AddPendingFile, GetPendingFile, GetSyncedFile } from '../db/helpers';
const shortid = require('shortid')

const fileAddedHandler = (path) => {
    console.log(`File ${path} has been added`)

    if(!GetPendingFile(path)) {
        AddPendingFile(null, path);
    }
}

export default fileAddedHandler;