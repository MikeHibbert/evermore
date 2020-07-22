
import {AddPendingFile, GetPendingFile, GetSyncedFile } from '../db/helpers';

const fileAddedHandler = (path) => {
    console.log(`File ${path} has been added`)

    const tx_id = "12345";

    if(!GetPendingFile(tx_id)) {
        AddPendingFile("12345", path);
    }
}

export default fileAddedHandler;