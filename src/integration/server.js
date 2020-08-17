const net = require('net');
const os = require('os');

import {settings} from '../config';
import processPipeMessage from './actions';
import {GetSyncedFolders, GetNewPendingFiles, GetPendingFiles, GetSyncedFiles} from '../db/helpers';
import { connected } from 'process';

let server = null;
let pipe_stream = null;
let clients = [];

export const sendMessage = (message, send_update_message) => {
    for(let i in clients) {
        clients[i].write(message);
    }
    // pipe_stream.write(message);

    // if(send_update_message) {
    //     pipe_stream.write("UPDATE_VIEW\n");
    // }    
}

const initNamePipe = () => { 
    let pipeAddress = null;

    // const AppName = 'EvermoreDatastore';
    const AppName = 'ownCloud';

    if(settings.PLATFORM == 'win32') {
        const userName = os.userInfo().username;
        pipeAddress  = `\\\\.\\pipe\\${AppName}-${userName}`;
    } else {

    }

    server = net.createServer(function(stream) {
        clients.push(stream);

        stream.on('data', function(data) {
            const message = data.toString();

            const response = processPipeMessage(message);
    
            if(message.indexOf('SHARE') == -1) {
                stream.write(response);
            }
        });
    
        stream.on('close',function(){
            console.log('Server: on close');
        })
    
        stream.on('end', function() {
            console.log('Server: on end')
            // server.close();
        });
       
    });    

    server.listen(pipeAddress,function(){
        console.log('Server: on listening');
    });
}

export default initNamePipe;