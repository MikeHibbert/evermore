import {
  AddProposedFile, 
  GetDownloads, 
  GetProposedFile, 
  GetSyncedFileFromPath, 
  GetPendingFile, 
  ResetPendingFile,
  ResetProposedFile,
  GetSyncedFolders
} from '../db/helpers';
import {sendMessage} from '../integration/server';
import {getFileUpdatedDate, getRalativePath, normalizePath} from '../fsHandling/helpers';
import { updateFileMonitoringStatuses } from '../qt-system-tray';

const fileChangedHandler = async (file_path) => {
  console.log(`File ${file_path} has been changed`);
  
  if(file_path.endsWith('.enc') || file_path.endsWith('.DS_Store') ) return;

  const sync_folder = GetSyncedFolders()[0];
  const current_downloads = GetDownloads();
  const normalized_file_path = normalizePath(file_path.replace(sync_folder, ''))
  const current_download_matches = current_downloads.filter(cd => cd.path == file_path);
  if(current_download_matches.length > 0) return;

  const relative_path = getRalativePath(file_path);
  const new_file_modified = getFileUpdatedDate(file_path);

  if(!GetProposedFile(normalized_file_path)) { 
    const pending = GetPendingFile(normalized_file_path);
    if(pending) {
      if(pending.modified < new_file_modified && pending.tx_id == null) {   
        // this the newest version so add it to pending for another upload     
        AddProposedFile(null, normalized_file_path, parseInt(pending.version + 1), true); 
        
      } else {
        ResetPendingFile(relative_path, new_file_modified);
      }
      sendMessage(`UNREGISTER_PATH:${normalized_file_path}\n`);
    } else {
      // if its not in Proposed or pending files it should have been put in the sync files 
      const synced_file = GetSyncedFileFromPath(file_path);

      if(synced_file) {
        // this the newest version so add it to pending for another upload
        AddProposedFile(null, normalized_file_path, parseInt(synced_file.version + 1), true); 
      } 
      sendMessage(`UNREGISTER_PATH:${file_path}\n`);
    }    

    updateFileMonitoringStatuses();
  }

  sendMessage(`UNREGISTER_PATH:${file_path}\n`);
}

export default fileChangedHandler;