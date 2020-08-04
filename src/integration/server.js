const net = require('net');
const ps = require('ps-node');
const os = require('os');
const tasklist = require('tasklist');
const taskkill = require('taskkill');
const {spawn} = require('child_process');
import {settings} from '../config';
import processPipeMessage from './actions';
import {GetSyncedFolders, GetNewPendingFiles, GetPendingFiles, GetSyncedFiles} from '../db/helpers';
import { connected } from 'process';

let server = null;

const initNamePipe = () => { 
    let pipeAddress = null;

    // const AppName = 'EvermoreDatastore';
    const AppName = 'ownCloud';

    if(settings.PLATFORM == 'win32') {
        const userName = os.userInfo().username;
        pipeAddress  = `\\\\.\\pipe\\${AppName}-${userName}`;
    } else {

    }

    const server = net.createServer(function(stream) {
        stream.on('data', function(data) {
            const response = processPipeMessage(data.toString());

            console.log('Server: on data response:', response);
    
            stream.write(response);
        });
    
        stream.on('close',function(){
            console.log('Server: on close');
        })
    
        stream.on('end', function() {
            console.log('Server: on end')
            // server.close();
        });

        const synced_folders = GetSyncedFolders();

        for(let i in synced_folders) {
            const synced_folder = synced_folders[i];

            stream.write(`REGISTER_PATH:${synced_folder}\n`);
        }

        const new_pending_files = GetNewPendingFiles();
        for(let i in new_pending_files) {
            stream.write(`STATUS:NEW:${new_pending_files[i]}\n`);
        }

        const pending_files = GetPendingFiles();
        for(let i in pending_files) {
            stream.write(`STATUS:SYNC:${pending_files[i]}\n`);
        }

        const synced_files = GetSyncedFiles();
        for(let i in synced_files) {
            stream.write(`STATUS:OK:${synced_files[i]}\n`);
        }

        // stream.write("UPDATE_VIEW\n");
    });

    

    server.listen(pipeAddress,function(){
        console.log('Server: on listening');
    });

    if(settings.PLATFORM == 'win32') {
        // need to kill explorer and start it again to ensure the Overlay provider talks to this process
        (async () => {
            const processes = await tasklist();
    
            let proc = null;
            for(let i in processes) {
                if(processes[i].imageName.indexOf('explorer.exe') != -1) {
                    proc = processes[i];
                }
            }
    
            if(proc) {
                try {
                    process.kill( proc.pid, 'SIGKILL');
                    spawn("explorer.exe").unref();
                } catch(e) {
                    console.log(`Unable to kill ${proc.pid}:${proc.imageName}`);
                }
                
    
            }
            
            console.log(processes);
        })();
    }    
}

export default initNamePipe;