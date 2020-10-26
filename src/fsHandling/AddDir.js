import {sendMessage} from '../integration/server';
import {
    pathExcluded
} from '../fsHandling/helpers';

const dirAddedHandler = (folder_path) => {
    console.log(`Directory ${folder_path} has been added`);

    if(!pathExcluded(folder_path)) {
        sendMessage(`REGISTER_PATH:${folder_path}\n`);
    }
}

export default dirAddedHandler;