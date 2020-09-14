import {AddPendingFile, GetPendingFile, GetSyncedFileFromPath } from '../db/helpers';
import {sendMessage} from '../integration/server';
import {getFileUpdateDate, getRalativePath} from '../fsHandling/helpers';
import {getDownloadableFiles} from '../crypto/arweave-helpers';

const fileChangedHandler = (path) => {
    console.log(`File ${path} has been changed`)

    const downloadable_files = getDownloadableFiles();

    const new_file_modified = getFileUpdatedDate(path);
    const relative_path = getRalativePath(path);

    if(downloadable_files.length > 0) {
        for(let i in downloadable_files) {
            const downloadable_file = downloadable_files[i];
    
            if(downloadable_file.file === relative_path && new_file_modified > downloadable_file.modified) {
              const pending_file = GetPendingFile(path);
              if(!pending_file) {
                  AddPendingFile(null, path);
                  sendMessage(`STATUS:SYNC:${path}\n`, true);
              } else {
                if(new_file_modified > pending_file.modified) { 
                  // there have been changes made before the uploader has uploaded the last modified changes so queue it 
                  // up again to make the extra
                  AddPendingFile(null, path, version=pending_file.version + 1);
                }
              }


            }
        }
    } else {
        if(!GetPendingFile(path)) { // if its not in pending files it should have been put in the sync files 
          const synced_file = GetSyncedFileFromPath(path);
          AddPendingFile(null, path, version=synced_file.version + 1); // this the newest version so add it to pending for another upload
          sendMessage(`STATUS:SYNC:${path}\n`, true);
        }
    }
}

export default fileChangedHandler;