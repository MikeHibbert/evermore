const fs = require('fs');
const Arweave = require('arweave');
const { readContract, interactRead, interactWrite  } = require('smartweave');

const arweave = Arweave.init(
    {
        host: 'arweave.net',// Hostname or IP address for a Arweave host
        port: 443,          // Port
        protocol: 'https',  // Network protocol http or https
        timeout: 20000,     // Network request timeouts in milliseconds
        logging: false,     // Enable network request logging
    }
);

const EVERMORE_TOKEN_TX_ID = '1TFZeEewEgUpqT5i2dsZSIRKJq3h1C7ZVi-gE8G-W6U';
const wallet_str = fs.readFileSync('/home/mike/Documents/Arweave/arweave-keyfile-h-Bgr13OWUOkRGWrnMT0LuUKfJhRss5pfTdxHmNcXyw.json');
const wallet = JSON.parse(wallet_str);

// targets = [
//     {address: 'R9PL9jt-mZoV6XcNjJD2uB2ajiFTC7PYZ_iyySzzz6U', qty: 1500}
// ];

// for(let i in targets) {
//     const target = targets[i];

//     interactWrite(arweave, wallet, EVERMORE_TOKEN_TX_ID, {function: 'transfer', qty: target.qty, target: target.address}).then(response => {
//         console.log(response);
//     });
// }

interactRead(arweave, wallet, EVERMORE_TOKEN_TX_ID, {function: 'balance'}).then(response => {
    console.log(response);
})