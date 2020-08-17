import { 
    GetNewOrPendingFile, 
    GetAllPendingFiles,
    GetSyncedFileFromPath, 
    GetSyncedFolders 
} from '../db/helpers';
import { settings } from '../config';

 
const processPipeMessage = (data) => {
    var commands = data.split('\n');
    
    let response = "";

    for(let i in commands) {
        const parts = commands[i].split(':');
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
                debugger;
                response = "SHARED:OK\n";
                break;
            default:
                response = response + `STATUS:NOP:${command_value}\n`;
                break;
        }

    }

    return response;
}

const getFileStatus = (path) => {
    if(settings.PLATFORM == 'win32') {
        if(path.indexOf('\\') == -1) {
            debugger;
            console.log(path);
        }        
    }

    let file_info = GetSyncedFileFromPath(path);

    if(file_info) return `STATUS:OK:${path}\n`;

    file_info = GetNewOrPendingFile(path);
    
    if(file_info) {
        if(file_info.tx_id == null) {
            return `STATUS:NEW:${path}\n`;
        } else {
            return `STATUS:SYNC:${path}\n`;
        }
    }

    return `STATUS:NOP:${path}\n`;
}

const getFileContextMenuItems = (path) => {
    var responses = ""; 

    let file_info = GetSyncedFileFromPath(path);

    if(file_info) {
        responses = responses + 'MENU_ITEM:SHARE::Copy Share Link\n';
    }

    responses = responses + "GET_MENU_ITEMS:END\n";

    return responses;
}


const getFolderStatus = (path) => {
    const synced_folders = GetSyncedFolders();

    let is_root_folder = false;
    for(let i in synced_folders) {
        const synced_folder = synced_folders[i];
        if(path == synced_folder) {
            is_root_folder = true;
        }
    }

    const pending_files = GetAllPendingFiles();
    if(is_root_folder) {
        if(pending_files.length > 0) {
            return `STATUS:SYNC:${path}\n`;
        } else {
            return `STATUS:OK:${path}\n`;
        }
    } else {        
        for(let i in pending_files) {
            const pending_file_parent_folder = pending_files[i].path.replace(pending_files[i].file, '');

            if(pending_file_parent_folder == path) {
                return `STATUS:SYNC:${path}\n`;
            }
        }

        return `STATUS:OK:${path}\n`;
    }

    return `STATUS:NOP:${path}\n`;
}

export default processPipeMessage;