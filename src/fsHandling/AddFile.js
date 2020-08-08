import {AddPendingFile, GetPendingFile, GetSyncedFile } from '../db/helpers';
import {sendMessage} from '../integration/server';
import {getFileUpdatedDate, getRalativePath} from '../fsHandling/helpers';
import {getDownloadableFiles} from '../crypto/arweave-helpers';

const fileAddedHandler = (path) => {
    console.log(`File ${path} has been added`)

    const downloadable_files = getDownloadableFiles();

    const new_file_modified = getFileUpdatedDate(path);
    const relative_path = getRalativePath(path);

    if(downloadable_files.length > 0) {
        for(let i in downloadable_files) {
            const downloadable_file = downloadable_files[i];
    
            if(downloadable_file.file === relative_path && new_file_modified > downloadable_file.modified) {
                if(!GetPendingFile(path)) {
                    AddPendingFile(null, path, downloadable_file.version + 1);
                    sendMessage(`STATUS:SYNC:${path}\n`, true);
                }
            }
        }
    } else {
        if(!GetPendingFile(path)) {
            AddPendingFile(null, path, 1);
            sendMessage(`STATUS:SYNC:${path}\n`, true);
        }
    }
}

export default fileAddedHandler;