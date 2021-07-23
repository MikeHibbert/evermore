const fs = require('fs');
const Arweave = require('arweave');
const moment = require('moment');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const { readContract, interactRead, interactWrite  } = require('smartweave');

const csvWriter = createCsvWriter({
    path: 'out.csv',
    header: [
      {id: 'wallet', title: 'Wallet'},
      {id: 'joined', title: 'First TX date'},
      {id: 'tx_num', title: 'Total TXs'},
      {id: 'total_data', title: 'Total Data'},
      {id: 'nfts', title: 'Total NFTs'},
      {id: 'costs', title: 'Total cost of TXs'},
    ]
  });

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

const getWebclientOwnerStats = async (address, wallet) => {
    let hasNextPage = true;
    let cursor = '';
    const owners = {total_txs: 0, total_ar: 0, nft_count: 0};
    let firstPage = 2147483647;

    while(hasNextPage) {
        const query = `{
            transactions(
                sort: HEIGHT_DESC
                first: ${firstPage}
                tags: [
                {
                    name: "Application",
                    values: ["Evermore"]
                }
                ]
                after: "${cursor}"
                ) {
                pageInfo {
                    hasNextPage
                }
                edges {
                    cursor
                    node {
                        owner {
                            address
                        }
                        id
                        tags {
                            name
                            value
                        }
                        block {
                            timestamp
                            height
                        }
                        fee {
                            winston
                            ar
                        }
                    }
                }
                
              }
        }`;
    
        const response = await arweave.api.request().post('https://arweave.net/graphql', {
            operationName: null,
            query: query,
            variables: {}
        });        
    
        if(response.status == 200) {            
            const data = response.data.data;
            data.transactions.edges.forEach(async edge => {
                const row = edge.node;
    
                row['tx_id'] = row.id;
    
                for(let i in row.tags) {
                    const tag = row.tags[i];
    
                    if(tag.name == 'version' || tag.name == 'modified' || tag.name == 'created' || tag.name == 'key_size') {
                        row[tag.name] = parseInt(tag.value);
                    } else {
                        row[tag.name] = tag.value;
                    }
                }
    
                if(row['Content-Type'] == "PERSISTENCE") return null;
    
                if(!row.hasOwnProperty('file')) return null;

                if(owners.hasOwnProperty(row.owner.address)) {
                    const owner = owners[row.owner.address];

                    owner.total_data += parseInt(row.file_size);
                    owner.transactions.push(row)
                } else {
                    owners[row.owner.address] = {
                        transactions: [row],
                        total_data: parseInt(row.file_size),
                        nfts: 0,
                        total_ar: 0
                    };
                }

                if(row['App-Name'] == 'SmartWeaveContract' || row['App-Name'] == "SmartWeaveAction") {
                    owners[row.owner.address].nfts += 1;
                    owners.nft_count += 1;
                }

                owners.total_txs += 1;
                const cost_ar = parseFloat(row.fee.ar);
                owners.total_ar += cost_ar;
                owners[row.owner.address].total_ar += cost_ar;
            });
    
            hasNextPage = data.transactions.pageInfo.hasNextPage;

            if(hasNextPage) {
                cursor = data.transactions.edges[data.transactions.edges.length - 1].cursor;
            }
        }        
    }
    
    
    return owners;
}

const getDesktopOwnerStats = async (address, wallet) => {
    let hasNextPage = true;
    let cursor = '';
    const owners = {total_txs: 0, total_ar: 0};
    let firstPage = 2147483647;

    while(hasNextPage) {
        const query = `{
            transactions(
                sort: HEIGHT_DESC
                first: ${firstPage}
                tags: [
                {
                    name: "App-Name",
                    values: ["EvermoreDatastore-v0.9.2"]
                },
                {
                    name: "Application",
                    values: ["Evermore"]
                    op: NEQ
                }
                ]
                after: "${cursor}"
                ) {
                pageInfo {
                    hasNextPage
                }
                edges {
                    cursor
                    node {
                        owner {
                            address
                        }
                        id
                        tags {
                            name
                            value
                        }
                        block {
                            timestamp
                            height
                        }
                        fee {
                            winston
                            ar
                        }
                    }
                }
                
              }
        }`;
    
        const response = await arweave.api.request().post('https://arweave.net/graphql', {
            operationName: null,
            query: query,
            variables: {}
        });        
    
        if(response.status == 200) {            
            const data = response.data.data;
            data.transactions.edges.forEach(async edge => {
                const row = edge.node;
    
                row['tx_id'] = row.id;
    
                for(let i in row.tags) {
                    const tag = row.tags[i];
    
                    if(tag.name == 'version' || tag.name == 'modified' || tag.name == 'created' || tag.name == 'key_size') {
                        row[tag.name] = parseInt(tag.value);
                    } else {
                        row[tag.name] = tag.value;
                    }
                }
    
                if(row['Content-Type'] == "PERSISTENCE") return null;
    
                if(!row.hasOwnProperty('file')) return null;

                if(owners.hasOwnProperty(row.owner)) {
                    const owner = owners[row.owner.address];

                    owner.total_data += row.file_size;
                    owner.transactions.push(row)
                } else {
                    owners[row.owner.address] = {
                        transactions: [row],
                        total_data: row.file_size,
                        costs: 0
                    };
                }

                owners.total_txs += 1;
                owners.total_ar += parseFloat(row.fee.ar);
                owners[row.owner.address].costs += parseFloat(row.fee.ar);
            });
    
            hasNextPage = data.transactions.pageInfo.hasNextPage;

            if(hasNextPage) {
                cursor = data.transactions.edges[data.transactions.edges.length - 1].cursor;
            }
        }        
    }
    
    
    return owners;
}

getWebclientOwnerStats().then(owners => {
    const owner_keys = Object.keys(owners);
    const total_owners = owner_keys.length - 1;
    const average_spend = owners.total_ar / total_owners;

    console.log(`Webclient: ${total_owners} total users and ${owners.total_txs} total transactions ${owners.total_ar} AR total spent`);
    console.log(`Total NFTs: ${owners.nft_count}`);
    console.log(`Average spend in AR: ${average_spend}`);

    createCSV(owners);
});

getDesktopOwnerStats().then(owners => {
    const owner_keys = Object.keys(owners);
    const total_owners = owner_keys.length - 1;

    console.log(`Desktop: ${total_owners} total users and ${owners.total_txs} total transactions ${owners.total_ar} AR total spent`);
});

function createCSV(owners) {

    const owner_keys = Object.keys(owners);

    const records = [];

    for(i in owner_keys) {

        if(i < 3) continue;

        const owner = owners[owner_keys[i]];

        let joined_timestamp = 999999999999999999999999999;

        for(let j in owner.transactions) {
            if(owner.transactions[j].created < joined_timestamp) {
                joined_timestamp = owner.transactions[j].created;
            }
        }

        const joined = moment.unix(joined_timestamp/1000);

        const record = {
            wallet: owner_keys[i],
            joined: joined.format("YYYY-M-D"),
            tx_num: owner.transactions.length,
            total_data: owner.total_data,
            nfts: owner.nfts,
            costs: owner.total_ar
        }

        records.push(record);
    }


    csvWriter
    .writeRecords(records)
    .then(()=> console.log('The CSV file was written successfully'));
}