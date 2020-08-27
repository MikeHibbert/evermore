const fs = require('fs');
import regeneratorRuntime from "regenerator-runtime";
import {GetSyncedFolders} from '../db/helpers';
import {arweave} from '../crypto/arweave-helpers';
import {settings} from '../config';

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

export function createRootFolder(path_parts, index, file_info) {
  if(index == path_parts.length - 1) {
      return {...file_info, name: path_parts[index], index: index, type: "file"};
  } else {
      return {name: path_parts[index], index: index, type: "folder", childeren: [createRootFolder(path_parts, index + 1, file_info)]};
  }
}

export function addToFolderChilderen(path_parts, index, file_info, path_obj) {
  if(index == path_parts.length - 1) {
      return path_obj.childeren.push({...file_info, name: path_parts[index], index: index, type: "file"});
  } else {
      const current_folder = path_parts[index];

      if(current_folder == path_obj.name) {
          addToFolderChilderen(path_parts, index + 1, file_info, path_obj);
      } else {
          const matched_folders = path_obj.childeren.filter((folder) => folder.name == current_folder);

          if(matched_folders.length == 0) {
              const folder = {name: current_folder, index: index, type: "folder", childeren: []};
              path_obj.childeren.push(folder);

              addToFolderChilderen(path_parts, index + 1, file_info, folder);
          } else {
              for(let i in matched_folders) {
                  const path = matched_folders[i];
                  addToFolderChilderen(path_parts, index + 1, file_info, path);
              }
          }
      
      }
  }
}

export const getFiles = async (address) => {
  const tx_ids = await arweave.arql({
      op: "and",
      expr1: {
          op: "equals",
          expr1: "from",
          expr2: address
      },
      expr2: {
          op: "equals",
          expr1: "App",
          expr2: settings.APP_NAME
      }
  });

  const tx_rows = await Promise.all(tx_ids.map(async (tx_id) => {
  
      let tx_row = {id: tx_id};
      
      var tx = await arweave.transactions.get(tx_id);
      
      tx.get('tags').forEach(tag => {
          let key = tag.get('name', { decode: true, string: true });
          let value = tag.get('value', { decode: true, string: true });
          
          if(key == "modified" || key == "version") {
              tx_row[key] = parseInt(value);
          } else {
              tx_row[key] = value;
          }
          
      });   

      return tx_row
  }));

  const final_rows = [];
  const folders = {};    

  for(let i in tx_rows) {
      const file_info = tx_rows[i];
      const in_final_rows = final_rows.filter((row) => row.path === file_info.path);

      let path_parts = [];
      if(file_info.path.indexOf('\\') != -1) {
          path_parts = file_info.path.split('\\')
      } 

      if(file_info.path.indexOf('/') != -1) {
          path_parts = file_info.path.split('/')
      }
      
      if(path_parts.length > 1) {
          if(folders.hasOwnProperty(path_parts[0])) {
              addToFolderChilderen(path_parts, 0, file_info, folders[path_parts[0]], 0);                
          } else {
              folders[path_parts[0]] = createRootFolder(path_parts, 0, file_info);
          }
          
      }      
  }

  if(!folders.hasOwnProperty("")) {
      folders[""] = {name: "", childeren: [], index: 0, type: "folder"};
  }

  return folders;
}