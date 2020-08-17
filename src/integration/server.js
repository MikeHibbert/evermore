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
let pipe_stream = null;

export const sendMessage = (message, send_update_message) => {
    pipe_stream.write(message);

    if(send_update_message) {
        pipe_stream.write("UPDATE_VIEW\n");
    }    
}

function blackholeEPIPE(stream) {
    stream.on('error', onerror)
    function onerror(err) {
        debugger;
      if (err.code === 'EPIPE') {
        stream._write = noopWrite
        stream._writev = noopWritev
        // stream._read = noopRead
        return stream.removeListener('error', onerror)
      }
      if (EE.listenerCount(stream, 'error') === 1) {
        stream.removeListener('error', onerror)
        stream.emit('error', err)
      }
    }
  }
  function noopWrite(chunk, enc, cb) {
    cb()
  }
  function noopRead() {
    this.push('')
  }
  function noopWritev(chunks, cb) {
    cb()
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
        pipe_stream = stream;

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