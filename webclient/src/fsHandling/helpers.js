import settings from '../app-config';
import { platform } from 'os';
const fs = require('fs');
const glob = require('glob');
const path = require('path');
const checkDiskSpace = require('check-disk-space');
const { crc32 } = require('crc');

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

export const convertPathsToInfos = (sync_folder, file_paths, is_root) => {

    const folders = {'':{ index: -1, id: "root", type: "folder", name: '', children: []}, checked: true};

    for(let i in file_paths) {
        const file_path = file_paths[i];
        const path_type = 'file'; 

        try {
            if(fs.lstatSync(file_path).isDirectory()) {
                continue;
            }
        } catch(e) {}

        const file_info = { path: normalizePath(file_path.replace(sync_folder, '')), children: [], type: path_type, checked: true, action: "upload" };

        let path_parts = [];
        if(file_info.path.indexOf('\\') != -1) {
            path_parts = file_info.path.split('\\')
        } 

        if(file_info.path.indexOf('/') != -1) {
            path_parts = file_info.path.split('/')
        }
        
        if(path_parts.length > 1) {
            if(folders.hasOwnProperty(path_parts[0])) {
                addToFolderChildrenOrUpdate(path_parts, 0, file_info, folders[path_parts[0]]);                
            }           
        }  
    }

    return folders;
}

export function addToFolderChildrenOrUpdate(path_parts, index, file_info, path_obj) {
    if(index == path_parts.length - 1) {
        const matched = path_obj.children.filter(child => child.path == file_info.path);

        if(matched.length == 0) {
            const fi = {...file_info, name: path_parts[index], index: index, type: 'file'};
            return path_obj.children.push(fi);
        } else {
            const match = matched[0];

            if(match.type == 'folder') return;

            // TODO: is this ever needed? filtering duplicates is done earlier so this may never execute!
            if(match.modified <= file_info.modified) {
                match.modified = file_info.modified;
                match.tx_id = file_info.tx_id;
            }
        }
        
    } else {
        const current_folder = path_parts[index];

        if(current_folder == path_obj.name) {
            addToFolderChildrenOrUpdate(path_parts, index + 1, file_info, path_obj);
        } else {
            const matched_folders = path_obj.children.filter((folder) => folder.name == current_folder);

            if(matched_folders.length == 0) {
                const folder = {...file_info, name: current_folder, index: index, type: "folder", children: []};
                path_obj.children.push(folder);

                addToFolderChildrenOrUpdate(path_parts, index + 1, file_info, folder);
            }  else {
                for(let i in matched_folders) {
                    const path = matched_folders[i];
                    addToFolderChildrenOrUpdate(path_parts, index + 1, file_info, path);
                }
            }

        }
    }
}

export const convertDatabaseRecordToInfos = (sync_folder, database_file_paths, is_root) => {
    const folders = {'':{ index: -1, id: "root", type: "folder", name: '', children: []}, checked: true};

    for(let i in database_file_paths) {
        const proposed_file = database_file_paths[i];         

        const system_paths = createFileAndFolderPathsFromSingleFilePath(sync_folder, proposed_file.path);

        for(let j in system_paths) {
            const system_path = system_paths[j];

            if(system_path.denormalised_path == sync_folder) continue;

            let path_type = 'file';

            try {
                if(fs.lstatSync(system_path.denormalised_path).isDirectory()) {
                    path_type = 'folder'; 
                    const system_path_parts = system_path.normalized_path.split('/');
                    system_path.name = system_path_parts[system_path_parts.length - 1];
                }
            } catch(e) {}

            let file_info = { 
                path: proposed_file.path, 
                name: system_path.name, 
                file: proposed_file.file, 
                children: [], 
                type: path_type, 
                checked: true, 
                tx_id: proposed_file.tx_id,
                action: proposed_file.action 
            };

            if(path_type == 'file') {
                const tx_id = proposed_file.hasOwnProperty('tx_id') ? proposed_file.tx_id : proposed_file.hasOwnProperty('id') ? proposed_file.id : null;
                const key_size = proposed_file.hasOwnProperty('key_size') ? proposed_file.key_size : null;

                file_info['tx_id'] = tx_id;
                file_info['key_size'] = key_size;
                file_info['modified'] = proposed_file.modified;
                file_info['is_update'] = proposed_file.is_update;
            }

            let path_parts = file_info.path.split('/');
            
            if(path_parts.length > 1) {
                if(folders.hasOwnProperty(path_parts[0])) {
                    addToFolderChildrenOrUpdate(path_parts, 0, file_info, folders[path_parts[0]], 0);                
                }           
            }  
        }
    }

    return folders;
}

const createFileAndFolderPathsFromSingleFilePath = (sync_folder, file_path) => {
    let path_parts = file_path.split('/');

    const denormalised_path_joiner = process.platform == 'win32' ? "\\" : "/";

    const paths = [];
    let current_denormalised_file_path = sync_folder;
    let current_normalised_file_path = normalizePath(sync_folder);

    for(let i in path_parts) {
        if(i == 0) {
            current_denormalised_file_path = current_denormalised_file_path + path_parts[i];
            current_normalised_file_path = current_normalised_file_path + path_parts[i];
        } else {
            current_denormalised_file_path = current_denormalised_file_path + denormalised_path_joiner + path_parts[i];
            current_normalised_file_path = current_normalised_file_path + '/' + path_parts[i];
        }

        paths.push({
            name: path_parts[path_parts.length - 1],
            normalized_path: current_normalised_file_path, 
            denormalised_path: current_denormalised_file_path
        });
    }

    return paths;
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

export const mergePathInfos = (from, to, root=true) => {
    if(root) {
        const root_info = {'':{ index: -1, id: "root", type: "folder", name: '', children: []}};

        root_info[''].children = mergePathInfos(from, to, false);

        return root_info;
    } else {
        const path_infos = [...to.children];

        from.children.forEach(a => {
            
            if(a.type == 'folder') {
                const to_items = path_infos.filter(item => item.type == 'folder' && item.name == a.name);

                if(to_items.length != 0) {
                    const b = to_items[0];
                    const folder_info = {name: a.name, type: 'folder', path: a.path, children: [], checked: a.checked, action: a.action }

                    if(b != undefined) {
                        folder_info.children = mergePathInfos(a, b, false);
                    }                    

                    path_infos.push(folder_info);                  
                } else {
                    const folder_info = {name: a.name, type: 'folder', path: a.path, children: [], checked: a.checked, action: a.action };
                    folder_info.children = mergePathInfos(a, folder_info, false);
                    path_infos.push(folder_info);
                }
            } else {
                const to_items = to.children.filter(item => item.type == a.type && item.name == a.name);
                
                if(to_items.length == 0) {
                    path_infos.push(a);
                } else {
                    const to_item = to_items[0];

                    if(to_item.modified < a.modified) {
                        to_item.action = a.action;
                        to_item.modified = a.modified;
                        to_item.tx_id = a.tx_id;
                    }
                }        
            }
        });
        
        

        return path_infos;
    }   
}

export const removePathInfosWithChecked = (path_infos, checked, root=true) => {
    if(root) {
        const root_info = {'':{ index: -1, id: "root", type: "folder", name: '', children: []}};

        root_info[''].children = removePathInfosWithChecked(path_infos, checked, false);

        return root_info;
    } else {
        const new_path_infos = [];

        path_infos.children.forEach(pa => {
            if(pa.type == 'folder') {
                if(pa.checked == checked) {
                    const folder_info = {name: pa.name, type: 'folder', path: pa.path, children: [], checked: pa.checked }

                    folder_info.children = removePathInfosWithChecked(pa, checked, false);

                    new_path_infos.push(folder_info);                  
                }
            } else {
                if(pa.checked == checked) {
                    new_path_infos.push(pa);
                }            
            }
        });

        return new_path_infos;
    }   
}

export const pathFoundInPathInfos = (path, path_infos) => {
    let path_found = false;

    for(let i in path_infos.children) {
        const pa = path_infos.children[i];

        if(pa.type == 'folder') {
            const path_found_in_folder = pathFoundInPathInfos(path, pa);    
            
            if(path_found_in_folder) {
                path_found = true;

                break;
            }
        } else {
            if(pa.path == path) {
                path_found = true;

                break;
            }            
        }
    }

    return path_found;
}

export const pathFoundInFolderPathInfos = (path, path_infos) => {
    let path_found = false;

    for(let i in path_infos.children) {
        const pa = path_infos.children[i];

        if(pa.type == 'folder') {
            if(path.indexOf(pa.path) == -1) {
                const path_found_in_folder = pathFoundInPathInfos(path, pa);    
            
                if(path_found_in_folder) {
                    path_found = true;

                    break;
                }
            } else {
                path_found = true;
                break;
            }
            
        } 
    }

    return path_found;
}

export const createCRCFor = (file_path) => {
    return new Promise((resolve, reject) => {
        let crc_result = '';
        const readStream = fs.createReadStream(file_path);

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

export const normalizePath = (file_path) => {
    if(process.platform == 'win32') {
        return file_path.split('\\').join('/')
    }

    return file_path
}
