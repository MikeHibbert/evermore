import {sendMessage} from '../integration/server';
import {
    pathExcluded
} from '../fsHandling/helpers';

const registered_folders = [];

const dirAddedHandler = (folder_path) => {
    console.log(`Directory ${folder_path} has been added`);

    if(!pathExcluded(folder_path)) {
        if(process.platform != 'darwin') sendMessage(`REGISTER_PATH:${folder_path}\n`);
        registered_folders.push(folder_path);
    } 
}

export const getRegisteredFolders = () => {
    return [...registered_folders];
}

export default dirAddedHandler;