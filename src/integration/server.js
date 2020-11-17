const net = require('net');
const os = require('os');

import {settings} from '../config';
import processPipeMessage from './actions';
import {GetSyncedFolders, GetNewPendingFiles, GetPendingFilesWithTransactionIDs, GetSyncedFiles} from '../db/helpers';
import { connected } from 'process';

let server = null;
let pipe_stream = null;
let clients = [];

export const sendMessage = (message, send_update_message=false) => {
    const sync_folders = GetSyncedFolders();
    const sync_folder = sync_folders[0];
    for(let i in clients) {
        try {
            if(send_update_message == true) {
                console.log(`UPDATE_VIEW sent send_update_message: ${send_update_message}`);
                clients[i].write("UPDATE_VIEW\n");
            }  else {
                clients[i].write(message);
                clients[i].write(`UNREGISTER_PATH:${sync_folder}\n`);
                clients[i].write(`REGISTER_PATH:${sync_folder}\n`);
            }
            
        } catch (e) {
            console.log(e);
        }
    }      
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
        stream['name'] = `${clients.length}_stream`;
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

            const that = this;
            clients = clients.filter(client => client.name !== that.name);
        })
    
        stream.on('end', function(args) {
            console.log('Server: on end')

            const that = this;
            clients = clients.filter(client => client.name !== that.name);
            // server.close();
        });
       
        stream.on('error', function(error) {
            console.log('Server: on error')
            // server.close();
        });
    });    

    server.listen(pipeAddress,function(){
        console.log('Server: on listening');
    });
}

export default initNamePipe;