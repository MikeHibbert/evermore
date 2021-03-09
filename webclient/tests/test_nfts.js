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

const wallet1_str = fs.readFileSync('/home/mike/Documents/Arweave/arweave-keyfile-h-Bgr13OWUOkRGWrnMT0LuUKfJhRss5pfTdxHmNcXyw.json');
const wallet1 = JSON.parse(wallet1_str);

const wallet2_str = fs.readFileSync('/home/mike/Documents/Arweave/arweave-keyfile-OFD5dO06Wdurb4w5TTenzkw1PacATOP-6lAlfAuRZFk.json');
const wallet2 = JSON.parse(wallet2_str);

// 6F8DQjCiMpTHMSje1AEJN_PmjUkFlRlL7OjhH477BZI
// j4_yvGIziDjSIVJngYRRjcq72mCU6ONfbI2exbWFvGo

arweave.transactions.get('j4_yvGIziDjSIVJngYRRjcq72mCU6ONfbI2exbWFvGo').then(transaction => {
    transaction.get('tags').forEach(tag => {
        let key = tag.get('name', {decode: true, string: true});
        let value = tag.get('value', {decode: true, string: true});
        console.log(`${key} : ${value}`);
        if(key === 'Init-State') {
            transaction[key] = JSON.parse(value);
        } else {
            transaction[key] = value;
        }
        
    });

    const contractTXID = 'wmgaIhJa96fpeUXTBQtL1dHo78XdBVzk07Bl5fu8INA';

    readContract(arweave, contractTXID).then(state => {
        console.log(state);
    });

    interactRead(arweave, wallet1, contractTXID, {function: 'balance'}).then(response => {
        console.log(response);
    })

    interactRead(arweave, wallet2, contractTXID, {function: 'balance'}).then(response => {
        console.log(response);
    })

    const target = 'OFD5dO06Wdurb4w5TTenzkw1PacATOP-6lAlfAuRZFk';
    interactWrite(arweave, wallet1, contractTXID, {
        function: 'transfer', 
        target: target,
        qty: 1
    },
    [
        {name: "Application", value: "Evermore" },
        {name: "Action", value: "Transfer" },
        {name: "target", value: target}
    ]).then(response => {
        console.log(response);
    });
});