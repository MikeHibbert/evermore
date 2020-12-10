import {
    GetProposedFileBy,
    RemoveProposedFile,
    GetSyncedFileFromPath, 
    DeleteSyncedFile,
    GetPendingFile,
    RemovePendingFile,
    GetSyncedFolders
} from '../db/helpers';
import { normalizePath } from './helpers';

const fileDeletedHandler = (file_path) => {
    console.log(`File ${file_path} has been removed`);

    const sync_folder = GetSyncedFolders()[0];
    const normalized_file_path = normalizePath(file_path.replace(sync_folder, ''))

    const synced_file = GetSyncedFileFromPath(normalized_file_path);
    if(synced_file) {
        DeleteSyncedFile(synced_file.tx_id);
    }

    const proposed_file = GetProposedFileBy({path: normalized_file_path});
    if(proposed_file) {
        RemoveProposedFile(normalized_file_path);
    }

    const pending_file = GetPendingFile(normalized_file_path);
    if(pending_file) {
        RemovePendingFile(normalized_file_path);
    }
}

export default fileDeletedHandler;