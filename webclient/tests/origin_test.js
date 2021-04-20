const fs = require('fs');
const Arweave = require('arweave');

const { v4 } = require('uuid');

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

async function createOriginal() {
    const transaction = await arweave.createTransaction({data: "Hello WOrld"});

    await arweave.transactions.sign(transaction, wallet1);

    console.log(transaction.id);

    const origin = v4();
    transaction.addTag('App-Name', "OriginTest");
    transaction.addTag('version_number', 1);
    transaction.addTag('origin', origin);

    const response = await arweave.transactions.post(transaction);

    console.log(origin);
}

async function UpdateRecord(previousTX) {
    const orginTag = previousTX.tags.filter(tag => tag.name == 'origin')[0];
    const versionTag = previousTX.tags.filter(tag => tag.name == 'version_number')[0];

    const transaction = await arweave.createTransaction({data: "Hello WOrld"});

    const version_number = parseInt(versionTag.value) + 1;

    transaction.addTag('App-Name', "OriginTest");
    transaction.addTag('version_number', version_number);
    transaction.addTag('origin', orginTag.value);

    await arweave.transactions.sign(transaction, wallet1);
    const response = await arweave.transactions.post(transaction);

    console.log(orginTag.value);
}

async function getChildRecords(tx_id) {
    const query = { query: `query 
        {
            transactions(
                sort: HEIGHT_ASC
                tags: [
                {
                    name: "App-Name",
                    values: ["OriginTest"]
                },
                {
                    name: "origin",
                    values: ["${tx_id}"]
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
        }
    `};

    const response = await arweave.api.request().post('https://arweave.net/graphql', query);

    if(response.status == 200) {
        return response.data.data.transactions.edges;
    }
}

async function main() {
    // createOriginal();

    const edges = await getChildRecords("41f8300f-0473-42fc-a6e5-c747a7d4a8d8");

    const previousTX = edges[edges.length - 1].node;

    await UpdateRecord(previousTX);

    console.log(edges)
}

main();