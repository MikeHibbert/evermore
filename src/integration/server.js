const NamedPipes = require('named-pipes');
const net = require('net');
import {settings} from '../config';

let server = null;

const initNamePipe = () => { 
    if(settings.PLATFORM == 'win32') {
        server = NamedPipes.listen('EvermoreDatastore');
    } else {

    }

    server.on('connect', (client) => {
        console.log('New Client Connected');
    
        client.send("Welcome", "Cheese is nice!");
    })
    
    server.on('data', (message) => {
        console.log(message);
    })
}

export default initNamePipe;