const fs = require('fs');
const glob = require('glob');
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

export function addToFolderChildren(path_parts, index, file_info, path_obj) {
  if(index == path_parts.length - 1) {
      return path_obj.children.push({...file_info, name: path_parts[index], index: index, type: "file"});
  } else {
      const current_folder = path_parts[index];

      if(current_folder == path_obj.name) {
          addToFolderChildren(path_parts, index + 1, file_info, path_obj);
      } else {
          const matched_folders = path_obj.children.filter((folder) => folder.name == current_folder);

          if(matched_folders.length == 0) {
              const folder = {...file_info, name: current_folder, index: index, type: "folder", children: []};
              path_obj.children.push(folder);

              addToFolderChildren(path_parts, index + 1, file_info, folder);
          } else {
              for(let i in matched_folders) {
                  const path = matched_folders[i];
                  addToFolderChildren(path_parts, index + 1, file_info, path);
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
  
      let tx_row = {id: tx_id, checked: true};
      
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

  const folders = {'':{ index: -1, id: "root", type: "folder", name: '', children: []}};    

  for(let i in tx_rows) {
      const file_info = tx_rows[i];

      let path_parts = [];
      if(file_info.path.indexOf('\\') != -1) {
          path_parts = file_info.path.split('\\')
      } 

      if(file_info.path.indexOf('/') != -1) {
          path_parts = file_info.path.split('/')
      }
      
      if(path_parts.length > 1) {
          if(folders.hasOwnProperty(path_parts[0])) {
              addToFolderChildren(path_parts, 0, file_info, folders[path_parts[0]], 0);                
          }           
      }      
  }

  return folders;
}

const getDirectoriesAndFiles = function (src, callback) {
    if(process.platform == "win32") {
        src = src.split(":")[1].replace(/\\/g, '/');
    }

    return glob(src + '/**/*', callback);
};

export const getSyncPathInfos = (callback) => {
    const sync_folders = GetSyncedFolders();

    if(sync_folders.length == 0) callback([]);
    const glob_result = getDirectoriesAndFiles(sync_folders[0], (err, file_paths) => {
        if (err) {
            console.log('Error', err);
        } 

        const file_infos = convertPathsToInfos(sync_folders[0], file_paths, true);

        callback(file_infos);
    });
}

const convertPathsToInfos = (sync_folder, file_paths, is_root) => {

    const folders = {'':{ index: -1, id: "root", type: "folder", name: '', children: []}};

    for(let i in file_paths) {
        const file_info = { path: file_paths[i].replace(sync_folder, ''), children: [] };

        let path_parts = [];
        if(file_info.path.indexOf('\\') != -1) {
            path_parts = file_info.path.split('\\')
        } 

        if(file_info.path.indexOf('/') != -1) {
            path_parts = file_info.path.split('/')
        }
        
        if(path_parts.length > 1) {
            if(folders.hasOwnProperty(path_parts[0])) {
                addToFolderChildren(path_parts, 0, file_info, folders[path_parts[0]], 0);                
            }           
        }  
    }

    return folders;
}