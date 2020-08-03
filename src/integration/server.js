const net = require('net');
const os = require('os');
import {settings} from '../config';
import processPipeMessage from './actions';
import {GetSyncedFolders} from '../db/helpers';

let server = null;

const initNamePipe = () => { 
    let pipeAddress = null;

    if(settings.PLATFORM == 'win32') {
        const userName = os.userInfo().username;
        pipeAddress  = `\\\\.\\pipe\\EvermoreDatastore-${userName}`;
    } else {

    }

    const server = net.createServer(function(stream) {
        
    
        stream.on('data', function(data) {
            console.log('Server: on data:', data.toString());

            const response = processPipeMessage(data.toString());

            stream.write(response);
        });
    
        stream.on('end', function() {
            console.log('Server: on end')
            // server.close();
        });

        stream.on('connect', function() {
            console.log('Server: on connection')

            const synced_folders = GetSyncedFolders();
            for(let i in synced_folders) {
                const synced_folder = synced_folders[i];
                stream.write(`REGISTER_PATH:${synced_folder}`);
            }
        });
    });

    server.on('close',function(){
        console.log('Server: on close');
    })

    server.listen(pipeAddress,function(){
        console.log('Server: on listening');
    })
}

export default initNamePipe;