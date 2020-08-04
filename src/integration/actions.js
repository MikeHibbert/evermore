import { GetPendingFile, GetSyncedFileFromPath, GetSyncedFolders } from '../db/helpers';
import { settings } from '../config';

// HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\ShellIconOverlayIdentifiers. 
const processPipeMessage = (data) => {
    var parts = data.split(':');
    const command = parts[0];

    parts = parts.filter((item) => item != command);

    const args = parts.join(':');

    console.log(`Command: ${command}, ${args}`);

    switch(command) {
        case "RETRIEVE_FILE_STATUS":
            return getFileStatus(args);
            break;
    }
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

    file_info = GetPendingFile(path.replace(/\r?\n|\r/g, ""));
    
    const synced_folders = GetSyncedFolders();

    let parent_folder = null;
    for(let i in synced_folders) {
        const synced_folder = synced_folders[i];
        if(path.indexOf(synced_folder) != -1) {
            parent_folder = synced_folder;
        }
    }

    if(file_info) {
        if(file_info.tx_id == null) {
            return `STATUS:NEW:${path}`;
        } else {
            return `STATUS:SYNC:${path}`;
        }
    }

    

    return "STATUS:NOP\n";
}



export default processPipeMessage;