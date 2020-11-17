const clipboardy = require('clipboardy');
const notifier = require('node-notifier');
import { 
    GetAllPendingFiles,
    GetPendingFile,
    GetProposedFile,
    GetSyncedFileFromPath, 
    GetSyncedFolders 
} from '../db/helpers';
import {pathExcluded, isPublicFile} from '../fsHandling/helpers';
import path from 'path';
import { settings } from '../config';

 
const processPipeMessage = (data) => {
    var commands = data.split('\n');
    
    let response = "";

    for(let i in commands) {
        let parts = commands[i].split(':');
        const command = parts[0];

        parts = parts.filter((item) => item != command);
    
        var command_value = parts.join(':');

        console.log(`Command: ${command}, ${command_value}`);

        switch(command) {
            case "RETRIEVE_FILE_STATUS":

                if(command_value.indexOf('.') != -1) { // its a file and not a folder path
                    response = response + getFileStatus(command_value);
                } else {
                    response = response + getFolderStatus(command_value);
                }            
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
            default:
                response = response + `STATUS:NOP:${command_value}\n`;
                break;
        }

    }

    return response;
}

export const openViewblockTransactionPage = (file_path) => {
    const file_info = GetSyncedFileFromPath(path.normalize(file_path));
    var url = `https://viewblock.io/arweave/tx/${file_info.tx_id}`;
    var start = (process.platform == 'darwin'? 'open': process.platform == 'win32'? 'start': 'xdg-open');
    require('child_process').exec(start + ' ' + url);
}

const shareFileLinkToClipboard = (file_path) => {
    const file_info = GetSyncedFileFromPath(path.normalize(file_path));

    if(file_info && isPublicFile(file_path) && !pathExcluded(file_path)) {
        clipboardy.writeSync(`https://arweave.net/${file_info.tx_id}`);

        notifier.notify({
            title: 'Evermore Datastore',
            icon: settings.NOTIFY_ICON_PATH,
            message: `A public link for '${file_info.file}' was copied to your clipboard.`
        });
    }
    
}

const getFileStatus = (file_path) => {
    if(settings.PLATFORM == 'win32') {
        if(file_path.indexOf('\\') == -1) {
            console.log(file_path);
        }        
    }

    if(!pathExcluded(file_path) && !file_path.endsWith('.enc')) {
        let file_info = GetPendingFile(path.normalize(file_path));
        
        if(file_info) {
            if(file_info.tx_id == null) {
                return `STATUS:NEW:${file_path}\n`;
            } else {
                return `STATUS:SYNC:${file_path}\n`;
            }
        }

        file_info = GetProposedFile(file_path);

        if(file_info) {
            return `STATUS:SYNC:${file_path}\n`;
        }

        file_info = GetSyncedFileFromPath(path.normalize(file_path));

        if(file_info) return `STATUS:OK:${file_path}\n`;
    }    

    return `STATUS:NOP:${file_path}\n`;
}

const getFileContextMenuItems = (file_path) => {
    var responses = ""; 

    const file_info = GetSyncedFileFromPath(path.normalize(file_path));

    if(file_info && isPublicFile(file_path) && !pathExcluded(file_path)) {
        responses = responses + 'MENU_ITEM:SHARE::Copy Share Link\n';
    }

    responses = responses + 'MENU_ITEM:DETAILS::View Transaction Details\n';

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