const fs = require('fs');
import {GetSyncedFolders} from '../db/helpers';

export const getFileUpdatedDate = (path) => {
  const stats = fs.statSync(path);
  return stats.mtime.getTime();
}

export const fileHasBeenModified = (path, modified) => {
    const current_modified = getFileUpdatedDate(path);

    if(current_modified > modified) {
      return true;
    }

    return false;
}

export const getRalativePath = (path) => {
  const sync_folders = GetSyncedFolders();

  let relative_path = path;

  for(let i in sync_folders) {
      const sync_folder = sync_folders[i];
      if(path.indexOf(sync_folder) != -1) {
          relative_path = path.replace(sync_folder, '');
      }
  }

  return relative_path;
}