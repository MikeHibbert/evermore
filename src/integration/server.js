const net = require('net');
const os = require('os');
const fs = require('fs');

import {settings} from '../config';
import processPipeMessage from './actions';
import {GetSyncedFolders, GetNewPendingFiles, GetPendingFilesWithTransactionIDs, GetSyncedFiles} from '../db/helpers';
import { connected } from 'process';


export const shutdownServer = () => {
    if(server) {
        server.close();
    }
}

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
    } 

    if(process.platform == 'darwin') {
        pipeAddress = `${settings.HOME_FOLDER}/G4X28XL4YD.${settings.APPLICATION_REV_DOMAIN}.socketApi`;
        pipeAddress = `/tmp/G4X28XL4YD.${settings.APPLICATION_REV_DOMAIN}.socketApi`;
        if(fs.existsSync(pipeAddress)) {
            fs.unlinkSync(pipeAddress);
        }

        console.log(`Pipe address: ${pipeAddress}`);

        // startMacOSSandboxIPC();

        server = net.createServer(function(stream) {
            stream['name'] = `${clients.length}_stream`;
            clients.push(stream);

            debugger;

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
}

// const XpcConnect = require('xpc-connect');

const startMacOSSandboxIPC = () => {
    // const ipc = require('node-ipc');

    // ipc.config.socketRoot = settings.GROUP_CONTAINER;
    // ipc.config.id = '.socketApi';
    // ipc.config.appspace = 'G4X28XL4YD.com.evermoredata.store';

    // ipc.serve(function(data) {
    //     ipc.server.on(
    //         'message',
    //         function(data,socket){
    //             ipc.log('got a message : '.debug, data);
    //             ipc.server.emit(
    //                 socket,
    //                 'message',  //this can be anything you want so long as
    //                             //your client knows.
    //                 data+' world!'
    //             );
    //         }
    //     );
    // });

    // ipc.server.start();

    
    debugger;
    const xpcConnect = new XpcConnect('G4X28XL4YD.com.evermoredata.store.socketApi');

    xpcConnect.on('error', function(message) {
        console.log(message);
    });

    xpcConnect.on('event', function(event) {
        console.log(event);
    });

    xpcConnect.setup();
}

export default initNamePipe;