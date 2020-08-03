import { GetPendingFile, GetSyncedFileFromPath } from '../db/helpers';
import { settings } from '../config';

const processPipeMessage = (data) => {
    var parts = data.split(':');
    const command = parts[0];

    parts = parts.filter((item) => item != command);

    const args = parts.join(':');

    console.log(`Command: ${command}, ${args}`);

    debugger;
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
    let file_info = GetPendingFile(path);

    if(file_info) {
        if(file_info.tx_id == null) {
            return "STATUS:NEW";
        } else {
            return "STATUS:SYNC";
        }
    }

    file_info = GetSyncedFileFromPath(path);

    if(file_info) return "STATUS:OK";

    return "STATUS:NOP";
}



export default processPipeMessage;