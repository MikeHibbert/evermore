import Arweave from 'arweave/web';

const hostname = window && window.location && window.location.hostname;

let arweave_config = null;

if(hostname === "localhost") {
    // arweave_config = {
    //     host: '127.0.0.1',
    //     port: 1984
    // }
} else {
    
}


const arweave = Arweave.init({
    host: 'arweave.net',// Hostname or IP address for a Arweave host
    port: 443,          // Port
    protocol: 'https',  // Network protocol http or https
    timeout: 20000,     // Network request timeouts in milliseconds
    logging: false,     // Enable network request logging
});


export default arweave;