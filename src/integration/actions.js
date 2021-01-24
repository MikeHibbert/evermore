const clipboardy = require('clipboardy');
const notifier = require('node-notifier');
const fs = require('fs');
import { 
    GetAllPendingFiles,
    GetAllProposedFiles,
    GetNewPendingFiles,
    GetPendingFile,
    GetProposedFile,
    GetSyncedFileFromPath, 
    GetSyncedFiles, 
    GetSyncedFolders 
} from '../db/helpers';
import {pathExcluded, isPublicFile, normalizePath} from '../fsHandling/helpers';
import path from 'path';
import { settings } from '../config';
import { fstat } from 'fs';
import { showNotification } from '../ui/notifications';
import { getRegisteredFolders } from '../fsHandling/AddDir';

function toBytesInt32 (num) {
    arr = new ArrayBuffer(4); // an Int32 takes 4 bytes
    view = new DataView(arr);
    view.setUint32(0, num, false); // byteOffset = 0; litteEndian = false
    return arr;
}
 
const processPipeMessage = (data, stream) => {
    var commands = data.split('\n');
    
    let response = "";

    for(let i in commands) {
        let parts = commands[i].split(':');
        const command = parts[0];

        parts = parts.filter((item) => item != command);
    
        var command_value = parts.join(':');
        const registered_folders = getRegisteredFolders();

        console.log(`Command: ${command}, ${command_value}`);

        switch(command) {
            case "GET_SYNC_MAIN_PATH":
                const sync_folder = GetSyncedFolders();
                response = sync_folder[0] + "\n";

                for(let i in registered_folders) {
                    const registered_folder = registered_folders[i];
                    response = response + registered_folder + "\n";
                }
                
                // stream.write(response);
                // continue;
                break;
            case "RETRIEVE_FILE_STATUS":

                if(command_value.indexOf('.') != -1) { // its a file and not a folder path
                    response = response + getFileStatus(command_value);
                } else {
                    response = response + getFolderStatus(command_value);
                }        
  
                break;

            case "RETRIEVE_FILE_STATUSES":
                const synced_files = GetSyncedFiles();
                const proposed_files = GetAllProposedFiles();
                const pending_files = GetNewPendingFiles();

                // debugger;

                for(let i in registered_folders) {
                    const registered_folder = registered_folders[i];
                    response = response + getFolderStatus(registered_folder);
                }

                for(let i in synced_files) {
                    let synced_file = synced_files[i];
                    response = response + getFileStatus(synced_file.path);
                }
                return response;

                break;
            case "RETRIEVE_FOLDER_STATUS":
                for(let i in registered_folders) {
                    const registered_folder = registered_folders[i];
                    response = response + getFolderStatus(registered_folder);
                }

                stream.write(response);

                continue;
                break;

            case "GET_STRINGS":
                if(command_value == "CONTEXT_MENU_TITLE") {
                    response = response + "STRING:CONTEXT_MENU_TITLE:Evermore\n";
                }
                break;
            case "GET_MENU_ITEMS":
                response = response + getFileContextMenuItems(command_value);

                break;
            case "SHARE":
                shareFileLinkToClipboard(command_value);
                response = "SHARED:OK\n";
                break;
            case "DETAILS":
                openViewblockTransactionPage(command_value);
                response = "DETAILS:OK\n";
                break;
            // default:
            //     response = response + `STATUS:NOP:${command_value}\n`;
            //     break;
        }

    }

    console.log(response);

    return response;
}

export const openViewblockTransactionPage = (file_path) => {
    const synced_folder = GetSyncedFolders()[0];
    const file_info = GetSyncedFileFromPath(normalizePath(file_path.replace(synced_folder, '')));
    var url = `https://viewblock.io/arweave/tx/${file_info.tx_id}`;
    var start = (process.platform == 'darwin'? 'open': process.platform == 'win32'? 'start': 'xdg-open');
    require('child_process').exec(start + ' ' + url);
}

const shareFileLinkToClipboard = (file_path) => {
    const synced_folder = GetSyncedFolders()[0];
    const file_info = GetSyncedFileFromPath(normalizePath(file_path.replace(synced_folder, '')));

    if(file_info && isPublicFile(file_path) && !pathExcluded(file_path)) {
        clipboardy.writeSync(`https://arweave.net/${file_info.tx_id}`);

        showNotification(`A public link for '${file_info.file}' was copied to your clipboard.`)
    }
    
}

const getFileStatus = (file_path) => {
    const synced_folder = GetSyncedFolders();
    const normalised_path = normalizePath(file_path.replace(synced_folder[0], ''));

    if(process.platform == 'darwin') {
        file_path = path.join(synced_folder[0], file_path);
    }

    if(!pathExcluded(file_path) && !normalised_path.endsWith('.enc')) {
        let file_info = GetPendingFile(normalised_path);
        
        if(file_info) {
            if(file_info.tx_id == null) {
                return `STATUS:NEW:${file_path}\n`;
            } else {
                return `STATUS:SYNC:${file_path}\n`;
            }
        }

        file_info = GetProposedFile(normalised_path);

        if(file_info) {
            return `STATUS:SYNC:${file_path}\n`;
        }

        file_info = GetSyncedFileFromPath(normalised_path);

        if(file_info) return `STATUS:OK:${file_path}\n`;
    }    

    return `STATUS:NOP:${file_path}\n`;
}

const getFileContextMenuItems = (file_path) => {
    const synced_folder = GetSyncedFolders();
    const normalised_path = normalizePath(file_path.replace(synced_folder[0], ''));

    var responses = ""; 

    if(file_path.indexOf(synced_folder[0]) != -1) {
        const file_info = GetSyncedFileFromPath(normalised_path);

        if(file_info && isPublicFile(file_path) && !pathExcluded(normalised_path)) {
            responses = responses + 'MENU_ITEM:SHARE::Copy Share Link\n';
        }

        if(!fs.lstatSync(file_path).isDirectory()) {
            responses = responses + 'MENU_ITEM:DETAILS::View Transaction Details\n';
        }    
    }

    responses = responses + "GET_MENU_ITEMS:END\n";

    return responses;
}


const getFolderStatus = (folder_path) => {
    const synced_folders = GetSyncedFolders();

    let is_root_folder = false;
    for(let i in synced_folders) {
        const synced_folder = path.normalize(synced_folders[i]);
        if(folder_path == synced_folder) {
            is_root_folder = true;
        }
    }

    const pending_files = GetAllPendingFiles();
    if(is_root_folder) {
        if(pending_files.length > 0) {
            return `STATUS:SYNC:${folder_path}\n`;
        } else {
            return `STATUS:OK:${folder_path}\n`;
        }
    } else {  
        for(let i in pending_files) {
            const pending_file_parent_folder = pending_files[i].path.replace(pending_files[i].file, '');

            if(pending_file_parent_folder == folder_path && !pathExcluded(folder_path)) {
                return `STATUS:SYNC:${folder_path}\n`;
            }
        }

        if(!pathExcluded(folder_path)) {
            return `STATUS:OK:${folder_path}\n`;
        } else {
            return `STATUS:NOP:${folder_path}\n`;
        }
    }    
}

export default processPipeMessage;