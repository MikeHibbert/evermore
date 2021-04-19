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

const EMD_CONTRACT_ADDRESS = '1TFZeEewEgUpqT5i2dsZSIRKJq3h1C7ZVi-gE8G-W6U';
const EDST_CONTRACT_ADDRESS = 'AVTqjPQGCCXim7Nl_gn3HMjE4k0Zi_eTFRJCNEVXZxw';

const wallet_path = '/home/mike/Documents/Arweave/arweave-keyfile-h-Bgr13OWUOkRGWrnMT0LuUKfJhRss5pfTdxHmNcXyw.json'
const wallet = JSON.parse(fs.readFileSync(wallet_path));

readContract(arweave, EMD_CONTRACT_ADDRESS).then(response => {
    debugger;
    Object.keys(response.balances).forEach(owner_address => {
        const balance = response.balances[owner_address];

        console.log(`${owner_address} : ${balance}`);

        interactWrite(arweave, wallet, EDST_CONTRACT_ADDRESS, {function: 'transfer', qty: balance, target: owner_address}).then(response => {
            console.log(`Allocated ${balance} to ${owner_address} - ${response}`);
        }); 
    })
});

// interactRead(arweave, wallet, EVERMORE_TOKEN_TX_ID, {function: 'balance'}).then(response => {
//     console.log(response);
// })