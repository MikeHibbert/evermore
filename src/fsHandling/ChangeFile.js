import {AddProposedFile, GetDownloads, GetProposedFile, GetSyncedFileFromPath, RemoveProposedFile } from '../db/helpers';
import {sendMessage} from '../integration/server';
import {getFileUpdatedDate, getRalativePath} from '../fsHandling/helpers';
import {getDownloadableFiles} from '../crypto/arweave-helpers';

const fileChangedHandler = (file_path) => {
    console.log(`File ${file_path} has been changed`);
    
    if(file_path.endsWith('.enc')) return;

    const current_downloads = GetDownloads();
    const current_download_matches = current_downloads.filter(cd => cd.path == file_path);
    if(current_download_matches.length > 0) return;

    const downloadable_files = getDownloadableFiles();

    const new_file_modified = getFileUpdatedDate(file_path);
    const relative_path = getRalativePath(file_path);

    if(downloadable_files.length > 0) {
        for(let i in downloadable_files) {
            const downloadable_file = downloadable_files[i];
    
            if(downloadable_file.file === relative_path && new_file_modified > downloadable_file.modified) {
              const proposed_file = GetProposedFile(file_path);
              if(!proposed_file) {
                  AddProposedFile(null, file_path);
                  sendMessage(`STATUS:SYNC:${file_path}\n`);
              } else {
                if(new_file_modified > proposed_file.modified) { 
                  // there have been changes made before the uploader has uploaded the last modified changes so queue it 
                  // up again to make the extra
                  AddProposedFile(null, file_path, parseInt(proposed_file.version) + 1);
                }
              }
            }
        }
    } else {
        if(!GetProposedFile(file_path)) { // if its not in Proposed files it should have been put in the sync files 
          const synced_file = GetSyncedFileFromPath(file_path);

          RemoveProposedFile(file_path);
          
          AddProposedFile(null, file_path, parseInt(synced_file.version + 1), true); // this the newest version so add it to pending for another upload
          sendMessage(`STATUS:SYNC:${file_path}\n`);
        }
    }
}

export default fileChangedHandler;