import {sendMessage} from '../integration/server';

const dirAddedHandler = (path) => {
    console.log(`Directory ${path} has been added`)
    sendMessage(`REGISTER_PATH:${path}\n`, true);
}

export default dirAddedHandler;