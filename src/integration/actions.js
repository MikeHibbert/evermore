import { 
    GetNewOrPendingFile, 
    GetAllPendingFiles,
    GetSyncedFileFromPath, 
    GetSyncedFolders 
} from '../db/helpers';
import { settings } from '../config';

 
const processPipeMessage = (data) => {
    var parts = data.split(':');
    const command = parts[0];

    parts = parts.filter((item) => item != command);

    const args = parts.join(':');

    console.log(`Command: ${command}, ${args}`);

    let response = null;
    switch(command) {
        case "RETRIEVE_FILE_STATUS":
            if(args.indexOf('.') != -1) { // its a file and not a folder path
                response = getFileStatus(args);
            } else {
                response = getFolderStatus(args);
            }            
            break;
        default:
            response = "STATUS:NOP\n";
            break;
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

    let file_info = GetSyncedFileFromPath(path.replace(/\r?\n|\r/g, ""));

    if(file_info) return `STATUS:OK:${path}`;

    file_info = GetNewOrPendingFile(path.replace(/\r?\n|\r/g, ""));
    
    if(file_info) {
        if(file_info.tx_id == null) {
            return `STATUS:NEW:${path}`;
        } else {
            return `STATUS:SYNC:${path}`;
        }
    }

    return "STATUS:NOP\n";
}


const getFolderStatus = (path) => {
    const synced_folders = GetSyncedFolders();

    let is_root_folder = false;
    for(let i in synced_folders) {
        const synced_folder = synced_folders[i];
        if(path.replace(/\r?\n|\r/g, "") == synced_folder) {
            is_root_folder = true;
        }
    }

    const pending_files = GetAllPendingFiles();
    if(is_root_folder) {
        if(pending_files.length > 0) {
            return `STATUS:SYNC:${path}`;
        } else {
            return `STATUS:OK:${path}`;
        }
    } else {        
        for(let i in pending_files) {
            const pending_file_parent_folder = pending_files[i].path.replace(pending_files[i].file, '');

            if(pending_file_parent_folder == path.replace(/\r?\n|\r/g, "")) {
                return `STATUS:SYNC:${path}`;
            }
        }

        return `STATUS:OK:${path}`;
    }

    return "STATUS:NOP\n";
}

export default processPipeMessage;