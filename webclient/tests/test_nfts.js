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

escape = function (str) {
    return str
      .replace(/[\\]/g, '')
      .replace(/[\/]/g, '')
      .replace(/[\b]/g, '')
      .replace(/[\f]/g, '')
      .replace(/[\n]/g, '')
      .replace(/[\r]/g, '')
      .replace(/[\t]/g, '');
  };

function sanitizeJSON(unsanitized){	
    return unsanitized.replace(/\\/g, "").replace(/\n/g, "").replace(/\r/g, "").replace(/\t/g, "").replace(/\f/g, "").replace(/\&/g, ""); 
}

const graphqlQuery =  `{
    transactions(
        first: 100
        owners: ["0wR4OTF4p-dtQUB3yGYG5QoG_37m8XyiK05yfRQYwh8"]
        tags: [
        {
            name: "App-Name",
            values: ["SmartWeaveContract", "SmartWeaveAction"]
        }
        ]
        after: ""
        ) {
        pageInfo {
            hasNextPage
        }
        edges {
            cursor
            node {
                id
                tags {
                    name
                    value
                }
            }
        }
        
      }
}`;

arweave.api.request().post('https://arweave.net/graphql', {
    operationName: null,
    query: graphqlQuery,
    variables: {}
}).then(response => {

    const data = response.data.data;
    debugger;
    console.log(response);
}); 

// arweave.transactions.get('GuxZWXNG6MsABf8pmp2qS2UftOx6CQoTHjee9sPJLjk').then(transaction => {
//     transaction.get('tags').forEach(tag => {
//         let key = tag.get('name', {decode: true, string: true});
//         let value = tag.get('value', {decode: true, string: true});
//         console.log(`${key} : ${value}`);
//         if(key === 'Init-State') {
            
//             try {
//                 const sanitzed = escape(value);

//                 debugger;

//                 transaction[key] = JSON.parse(sanitzed);
                
//             } catch(e) {
//                 debugger;
//                 console.log(e);
//             }
            
//             debugger;
//         } else {
//             transaction[key] = value;
//         }

        
        
//     });

//     // const contractTXID = 'wmgaIhJa96fpeUXTBQtL1dHo78XdBVzk07Bl5fu8INA';
//     const contractTXID = 'GuxZWXNG6MsABf8pmp2qS2UftOx6CQoTHjee9sPJLjk';

//     readContract(arweave, contractTXID).then(state => {
//         console.log(state);
//     });

//     interactRead(arweave, wallet1, contractTXID, {function: 'balance'}).then(response => {
//         console.log(response);
//     })

//     interactRead(arweave, wallet2, contractTXID, {function: 'balance'}).then(response => {
//         console.log(response);
//     })

//     const target = 'OFD5dO06Wdurb4w5TTenzkw1PacATOP-6lAlfAuRZFk';
//     interactWrite(arweave, wallet1, contractTXID, {
//         function: 'transfer', 
//         target: target,
//         qty: 1
//     },
//     [
//         {name: "Application", value: "Evermore" },
//         {name: "Action", value: "Transfer" },
//         {name: "target", value: target}
//     ]).then(response => {
//         console.log(response);
//     });
// });