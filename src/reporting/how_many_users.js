const fs = require('fs');
const axios = require('axios');
const Arweave = require('arweave');
const { readContract, interactRead, interactWrite  } = require('smartweave');

const arweave = Arweave.init({
  host: 'arweave.net', // Arweave Gateway
  port: 443,
  protocol: 'https',
  timeout: 600000,
});

const CONTRACT_ADDRESS = '1TFZeEewEgUpqT5i2dsZSIRKJq3h1C7ZVi-gE8G-W6U';
const total_daily_token_distribution_amount = Math.ceil(1035713 / 12); // daily amount to distribute for 14 days
const LIMIT_THRESHOLD = 3000;

async function get_24_hour_qulaifying_data_transactions() {
    let completed = false;
    let weightedList = [];
    let firstPage = 2147483647; // Max size of query for GQL
    let cursor = "";
    let timeStamp = new Date();
    let yesterday = new Date(timeStamp);
    yesterday.setDate(yesterday.getDate() - 1);
  
    let count = 0;
    while (!completed) {
      // Create the query to search for all ardrive transactions.
      let transactions = await query_for_data_uploads(firstPage, cursor);

      if(transactions == undefined) completed =true;

      const { edges } = transactions;
      edges.forEach((edge) => {
        cursor = edge.cursor;
        const { node } = edge;
        const { data } = node;
        const { owner } = node;
        const { block } = node;
        if (block !== null) {
          let timeStamp = new Date(block.timestamp * 1000);
          // We only want results from last 24 hours, defined by milliseconds since epoch
          if (yesterday.getTime() <= timeStamp.getTime()) {
            // We only want data transactions
            if (parseInt(data.size) >= 0) { // more than one GB uploaded
              // Does this wallet address exist in our array?
              let objIndex = weightedList.findIndex((obj => obj.address === owner.address));
              if (objIndex >= 0) {
              // If it exists, then we increment the existing data amount
                // console.log ("Existing wallet found %s with %s data", weightedList[objIndex].address, weightedList[objIndex].weight);
                // console.log("Adding ", data.size);
                weightedList[objIndex].count += 1;
                weightedList[objIndex].dataSize += parseInt(data.size);
                weightedList[objIndex].txs.push(node.id);
              } 
              else {
                // Else we add a new user into our Astatine List
                // console.log("Adding new wallet ", owner.address);
                let user = {
                  address: owner.address,
                  count: 1,
                  dataSize: parseInt(data.size),
                  txs: [node.id]
                };
                weightedList.push(user);
              }
            }
          }
          else {
            // The blocks are too old, and we dont care about them
            completed = true;
          }
        }
      })
      count++;

      if(count >  LIMIT_THRESHOLD) {
        completed = true;
      } 
      console.log(`Page ${count} get_24_hour_qulaifying_data_transactions STAGE 1`);
    }

    completed = false;
    while (!completed) {
      // Create the query to search for all ardrive transactions.
      let transactions = await query_for_desktop_data_uploads(firstPage, cursor);
      
      if(transactions == undefined) completed =true;

      const { edges } = transactions;
      edges.forEach((edge) => {
        cursor = edge.cursor;
        const { node } = edge;
        const { data } = node;
        const { owner } = node;
        const { block } = node;
        if (block !== null) {
          let timeStamp = new Date(block.timestamp * 1000);
          // We only want results from last 24 hours, defined by milliseconds since epoch
          if (yesterday.getTime() <= timeStamp.getTime()) {
            // We only want data transactions
            if (parseInt(data.size) >= 0) { // more than one GB uploaded
              // Does this wallet address exist in our array?
              let objIndex = weightedList.findIndex((obj => obj.address === owner.address));
              if (objIndex >= 0) {
              // If it exists, then we increment the existing data amount
                // console.log ("Existing wallet found %s with %s data", weightedList[objIndex].address, weightedList[objIndex].weight);
                // console.log("Adding ", data.size);
                weightedList[objIndex].count += 1;
                weightedList[objIndex].dataSize += parseInt(data.size);
                weightedList[objIndex].txs.push(node.id);
              } 
              else {
                // Else we add a new user into our Astatine List
                // console.log("Adding new wallet ", owner.address);
                let user = {
                  address: owner.address,
                  txs: [node.id],
                  count: 1,
                  dataSize: parseInt(data.size)
                };
                weightedList.push(user);
              }
            }
          }
          else {
            // The blocks are too old, and we dont care about them
            completed = true;
          }
        }
      })
      count++;

      if(count >  LIMIT_THRESHOLD) {
        completed = true;
      } 

      console.log(`Page ${count} get_24_hour_qulaifying_data_transactions STAGE 2`);
    }
    return weightedList;
}

async function query_for_desktop_data_uploads(firstPage, cursor) {
  try {
  const query = {
    query: `query {
    transactions(
      sort: HEIGHT_DESC
      tags: { name: "App-Name", values: ["EvermoreDatastore-v0.9.2"] }
      first: ${firstPage}
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
          data {
            size
          }
          block {
            timestamp
          }
        }
      }
    }
  }`,
  };
  // Call the Arweave Graphql Endpoint
  const response = await arweave.api
    .request()
    .post('https://arweave.net/graphql', query);
  const { data } = response.data;
  const { transactions } = data;
  return transactions;
} catch (err) {
  console.log (err)
  console.log ("uh oh cant query")
}
}

async function query_for_data_uploads(firstPage, cursor) {
    try {
    const query = {
      query: `query {
      transactions(
        sort: HEIGHT_DESC
        tags: { name: "Application", values: ["Evermore"] }
        first: ${firstPage}
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
            data {
              size
            }
            block {
              timestamp
            }
          }
        }
      }
    }`,
    };
    // Call the Arweave Graphql Endpoint
    const response = await arweave.api
      .request()
      .post('https://arweave.net/graphql', query);
    const { data } = response.data;
    const { transactions } = data;
    return transactions;
  } catch (err) {
    console.log (err)
    console.log ("uh oh cant query")
  }
}

async function get_24_hour_nft_transactions() {
    let completed = false;
    let weightedList = [];
    let firstPage = 2147483647; // Max size of query for GQL
    let cursor = "";
    let timeStamp = new Date();
    let yesterday = new Date(timeStamp);
    yesterday.setDate(yesterday.getDate() - 1);

    let count = 0;
  
    while (!completed) {
      // Create the query to search for all ardrive transactions.
      let transactions = await query_for_data_uploads(firstPage, cursor);
      const { edges } = transactions;
      edges.forEach((edge) => {
        cursor = edge.cursor;
        const { node } = edge;
        const { data } = node;
        const { owner } = node;
        const { block } = node;
        if (block !== null) {
          let timeStamp = new Date(block.timestamp * 1000);
          let is_nft = node.tags.filter(tag => tag.name == 'App-Name' && tag.value == 'SmartWeaveContract').length > 0 ? true : false;
          // We only want results from last 24 hours, defined by milliseconds since epoch
          if (yesterday.getTime() <= timeStamp.getTime()) {
            // We only want data transactions
            if (parseInt(data.size) >= 1000000000 || is_nft) {
              // Does this wallet address exist in our array?
              let objIndex = weightedList.findIndex((obj => obj.address === owner.address));
              if (objIndex >= 0) {
              // If it exists, then we increment the existing data amount
                // console.log ("Existing wallet found %s with %s data", weightedList[objIndex].address, weightedList[objIndex].weight);
                // console.log("Adding ", data.size);
                weightedList[objIndex].count += 1;
                weightedList[objIndex].txs.push(node.id)
              } 
              else {
                // Else we add a new user into our Astatine List
                // console.log("Adding new wallet ", owner.address);
                let user = {
                  address: owner.address,
                  count: 1,
                  txs: [node.id]
                };
                weightedList.push(user);
              }
            }
          }
          else {
            // The blocks are too old, and we dont care about them
            completed = true;
          }
        }
      })

      count++;
      console.log(`Page ${count} get_24_hour_nft_transactions`);
    }
    return weightedList;
}


get_24_hour_nft_transactions().then(nft_users => {
    
    get_24_hour_qulaifying_data_transactions().then(data_upload_users => {
        
        let existing_users = [];
        try {
            existing_users = JSON.parse(fs.readFileSync('existing_users.json'));
        } catch (e) {
            
        }
        
        const new_users_found = [];
        let nft_users_payments = 0;
        const qualifying_nft_users = [];
        for(let i in nft_users) {
            const nft_user = nft_users[i];
            const nft_user_index = existing_users.findIndex(user_address => user_address == nft_user.address);
            const excluded_user_index = excluded_accounts.findIndex(user_address => user_address == nft_user.address);
                
            if(excluded_user_index != -1) {
                continue;
            }

            nft_users_payments += nft_user.count;

            qualifying_nft_users.push(nft_user);

            if(nft_user_index > -1) {
                console.log(`Found NFT from exisiting user ${nft_user.address}`);
            } else {
                existing_users.push(nft_user.address);
                
                if(excluded_user_index == -1) {
                    new_users_found.push(nft_user.address);
                }
                
            }
        }

        console.log(qualifying_nft_users);

        const qualifying_data_users = [];
        for(let i in data_upload_users) {
            const data_upload_user = data_upload_users[i];
            const data_upload_user_index = existing_users.findIndex(user_address => user_address == data_upload_user.address);
            if(data_upload_user.dataSize > 1073741824) {
              qualifying_data_users.push(data_upload_user);
            }
            if(data_upload_user_index == -1) {
                existing_users.push(data_upload_user.address);
                const new_user_index = new_users_found.findIndex(user_address => user_address == data_upload_user.address);
                if(new_user_index > 0) {
                    console.log(`new user ${data_upload_user.address} duplicated found in new_users list`);
                } else {
                    const excluded_user_index = excluded_accounts.findIndex(user_address => user_address == data_upload_user.address);
                    if(excluded_user_index == -1) {
                        new_users_found.push(data_upload_user.address);
                    }
                }
            }
        }

        console.log(qualifying_data_users);

        const total_token_shares = new_users_found.length + nft_users_payments + qualifying_data_users.length;
        console.log(new_users_found);

        const tokens_per_allocation = Math.ceil(total_daily_token_distribution_amount/total_token_shares);
        console.log(`Todays allocation is ${total_token_shares} shares of ${total_daily_token_distribution_amount} which is ${tokens_per_allocation} tokens per qualifying transaction`);
        console.log(`New Users: ${new_users_found.length} NFTs: ${nft_users_payments} (> 1GB Uploads): ${qualifying_data_users.length}`);

        const DRY_RUN = true;
        if(!DRY_RUN) {
          fs.writeFileSync('existing_users.json', JSON.stringify(existing_users));
        }

        const wallet_path = '/home/mike/Documents/Arweave/arweave-keyfile-h-Bgr13OWUOkRGWrnMT0LuUKfJhRss5pfTdxHmNcXyw.json'
        const wallet = JSON.parse(fs.readFileSync(wallet_path));
        const EVERMORE_TOKEN_TX_ID = '1TFZeEewEgUpqT5i2dsZSIRKJq3h1C7ZVi-gE8G-W6U';

        for(let i in new_users_found) {
          const new_user_address = new_users_found[i];
          if(DRY_RUN) {
            console.log(`Allocated ${tokens_per_allocation} to NEW user ${new_user_address}`);
          } else {
            interactWrite(arweave, wallet, EVERMORE_TOKEN_TX_ID, {function: 'transfer', qty: tokens_per_allocation, target: new_user_address}).then(response => {
                console.log(`Allocated ${tokens_per_allocation} to NEW user ${new_user_address} - ${response}`);
            });
          }
        }

        for(let i in qualifying_nft_users) {
          const nft_user = qualifying_nft_users[i];
          const total_tokens = tokens_per_allocation * nft_user.count;
          if(DRY_RUN) {
            console.log(`Allocated ${total_tokens} to ${nft_user.address} (= ${nft_user.count} payments)`);
          } else {
            interactWrite(arweave, wallet, EVERMORE_TOKEN_TX_ID, {function: 'transfer', qty: total_tokens, target: nft_user.address}).then(response => {
                console.log(`Allocated ${total_tokens} to ${nft_user.address} (= ${nft_user.count} payments) - ${response}`);
            });
          }
        }

        for(let i in qualifying_data_users) {
          const data_user = qualifying_data_users[i];
          if(DRY_RUN) {
            console.log(`Allocated ${tokens_per_allocation} to ${data_user.address}`);
          } else {
            interactWrite(arweave, wallet, EVERMORE_TOKEN_TX_ID, {function: 'transfer', qty: tokens_per_allocation, target: data_user.address}).then(response => {
                console.log(`Allocated ${tokens_per_allocation} to ${data_user.address} - ${response}`);
            });  
          }
                    
        }
    })
});

const excluded_accounts = [
  'h-Bgr13OWUOkRGWrnMT0LuUKfJhRss5pfTdxHmNcXyw', 
  'OFD5dO06Wdurb4w5TTenzkw1PacATOP-6lAlfAuRZFk',
  '73JmD246_J2wNOU-JKm05KqFBwrT-sqUq2w1u8kbE9U',
];
