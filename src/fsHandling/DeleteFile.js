import {
    GetProposedFileBy,
    RemoveProposedFile,
    GetSyncedFileFromPath, 
    DeleteSyncedFile,
    GetPendingFile,
    RemovePendingFile
} from '../db/helpers';

const fileDeletedHandler = (file_path) => {
    console.log(`File ${file_path} has been removed`);

    const synced_file = GetSyncedFileFromPath(file_path);
    if(synced_file) {
        DeleteSyncedFile(synced_file.tx_id);
    }

    const proposed_file = GetProposedFileBy({path: file_path});
    if(proposed_file) {
        RemoveProposedFile(file_path);
    }

    const pending_file = GetPendingFile(file_path);
    if(pending_file) {
        RemovePendingFile(file_path);
    }
}

export default fileDeletedHandler;