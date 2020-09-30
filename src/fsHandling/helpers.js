const fs = require('fs');
const glob = require('glob');
const path = require('path');
import regeneratorRuntime from "regenerator-runtime";
import {GetSyncedFolders} from '../db/helpers';
import {arweave} from '../crypto/arweave-helpers';
import {settings} from '../config';
const { crc32 } = require('crc');

export const getFileUpdatedDate = (path) => {
    const stats = fs.statSync(path);
    return stats.mtime.getTime();
}

export const setFileUpdatedDatetime = async (path, timestamp) => {
    const datetime = new Date(timestamp);
    fs.utimesSync(path, datetime, datetime);
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

export const getSystemPath = (relative_path) => {
    const sync_folders = GetSyncedFolders();

    return path.join(sync_folders[0], relative_path);
}

export function addToFolderChildren(path_parts, index, file_info, path_obj) {
    if(index == path_parts.length - 1) {
        return path_obj.children.push({...file_info, name: path_parts[index], index: index});
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

export const getOnlineFilesAndFoldersStructure = async (address) => {
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

    console.log(JSON.stringify(folders));

    return folders;
}

const getDirectoriesAndFiles = function (src, callback) {
    if(process.platform == "win32") {
        src = src.split(":")[1].replace(/\\/g, '/');
    }

    return glob(src + '/**/*', callback);
};

export const getOfflineFilesAndFoldersStructure = (callback) => {
    const sync_folders = GetSyncedFolders();

    if(sync_folders.length == 0) callback([]);
    
    const glob_result = getDirectoriesAndFiles(sync_folders[0], (err, file_paths) => {
        if (err) {
            console.log('Error', err);
        } 

        const path_infos = convertPathsToInfos(sync_folders[0], file_paths, true);

        callback(path_infos);
    });
}

const convertPathsToInfos = (sync_folder, file_paths, is_root) => {

    const folders = {'':{ index: -1, id: "root", type: "folder", name: '', children: []}};

    for(let i in file_paths) {
        const file_path = file_paths[i];
        const path_type = 'file'; 

        try {
            if(fs.lstatSync(file_path).isDirectory()) {
                path_type = 'folder'; 
            }
        } catch(e) {}

        const file_info = { path: file_path.replace(sync_folder, ''), children: [], type: path_type, checked: true };

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

export const comparePathInfos = (a, b) => {
    let same = true;

    if(a.type == "file" && b.type == "file") {
        if(a.path == b.path) {
            return true;
        }
    } else {
        if(a.path == b.path) {
            if(a.type == "folder" && b.type == "folder" && a.children.length == 0 && b.children.length == 0) { 
                // empty folder
                return true;
            }
        } else {
            return false;
        }
    }    

    for(let i in a.children) {
        try {
            const infoA = a.children[i];
            const infoB = b.children[i];

            same = comparePathInfos(infoA, infoB);

            if(!same) {
                return false;
            }
        } catch(e) {
            return false;
        }
    }

    return same;
}

export const diffPathInfos = (a, b, root) => {
    if(root) {
        const root_info = {'':{ index: -1, id: "root", type: "folder", name: '', children: []}};

        root_info[''].children = diffPathInfos(a, b, false);

        return root_info;
    } else {
        const path_infos = [];
        a.children.forEach(a_item => {
                
            if(a_item.type == 'folder') {
                const b_items = b.children.filter(item => item.type == 'folder' && item.name == a_item.name);
                if(b_items.length > 0) {
                    const b_item = b_items[0];

                    const folder_info = {name: b_item.name, type: 'folder', path: b_item.path }
                    folder_info['children'] = diffPathInfos(a_item, b_item, false);

                    if(folder_info.children.length > 0) {
                        path_infos.push(folder_info);
                    }                    
                }
            } else {
                const b_items = b.children.filter(item => item.type == 'file' && item.name == a_item.name && item.modified > a_item.modified);
                if(b_items.length > 0) {
                    path_infos.push(b_items[0]);
                }            
            }
        });

        return path_infos;
    }   
}

export const createCRCFor = (path) => {
    return new Promise((resolve, reject) => {
        let crc_result = '';
        const readStream = fs.createReadStream(path);

        readStream.on('data', (chunk) => {
            crc_result = crc32(chunk, crc_result).toString(16);
        });

        readStream.on('end', () => {
            return resolve(crc_result);
        });

        readStream.on('error', (err) => {
            return reject(err);
        });

        readStream.read();
    });
}

export const createTempFolder = () => {
    const sync_folders = GetSyncedFolders();

    if(sync_folders.length > 0) {
        const temp_folder = path.join(sync_folders[0], 'tmp');
     
        if(!fs.accessSync(temp_folder, fs.constants.F_OK)) {
            fs.mkdirSync(temp_folder);
        }
    }
}

export const removeTempFolder = () => {
    const sync_folders = GetSyncedFolders();

    if(sync_folders.length > 0) {
        const temp_folder = path.join(sync_folders[0], 'tmp');
     
        if(fs.accessSync(temp_folder, fs.constants.F_OK)) {
            fs.unlinkSync(temp_folder);
        }
    }
}

