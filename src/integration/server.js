const net = require('net');
const os = require('os');

import {settings} from '../config';
import processPipeMessage from './actions';
import {GetSyncedFolders, GetNewPendingFiles, GetPendingFilesWithTransactionIDs, GetSyncedFiles} from '../db/helpers';
import { connected } from 'process';

let server = null;
let pipe_stream = null;
let clients = [];

export const sendMessage = (message, send_update_message) => {
    for(let i in clients) {
        try {
            clients[i].write(message);
        } catch (e) {
            console.log(e);
        } finally {

        }
        
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