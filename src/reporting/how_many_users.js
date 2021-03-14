const fs = require('fs');
const axios = require('axios');
const Arweave = require('arweave');
const arweave = Arweave.init({
  host: 'arweave.net', // Arweave Gateway
  port: 443,
  protocol: 'https',
  timeout: 600000,
});

const total_daily_token_distribution_amount = Math.ceil(1500000 / 14); // daily amount to distribute for 14 days

async function get_24_hour_qulaifying_data_transactions() {
    let completed = false;
    let weightedList = [];
    let firstPage = 2147483647; // Max size of query for GQL
    let cursor = "";
    let timeStamp = new Date();
    let yesterday = new Date(timeStamp);
    yesterday.setDate(yesterday.getDate() - 1);
  
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
          // We only want results from last 24 hours, defined by milliseconds since epoch
          if (yesterday.getTime() <= timeStamp.getTime()) {
            // We only want data transactions
            if (data.size >= 1000000000) { // more than one GB uploaded
              // Does this wallet address exist in our array?
              let objIndex = weightedList.findIndex((obj => obj.address === owner.address));
              if (objIndex >= 0) {
              // If it exists, then we increment the existing data amount
                // console.log ("Existing wallet found %s with %s data", weightedList[objIndex].address, weightedList[objIndex].weight);
                // console.log("Adding ", data.size);
                weightedList[objIndex].count += 1;
              } 
              else {
                // Else we add a new user into our Astatine List
                // console.log("Adding new wallet ", owner.address);
                let user = {
                  address: owner.address,
                  count: 1,
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
    }
    return weightedList;
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
          if (yesterday.getTime() <= timeStamp.getTime() || is_nft) {
            // We only want data transactions
            if (data.size >= 1000000000 || is_nft) {
              // Does this wallet address exist in our array?
              let objIndex = weightedList.findIndex((obj => obj.address === owner.address));
              if (objIndex >= 0) {
              // If it exists, then we increment the existing data amount
                // console.log ("Existing wallet found %s with %s data", weightedList[objIndex].address, weightedList[objIndex].weight);
                // console.log("Adding ", data.size);
                weightedList[objIndex].count += 1;
              } 
              else {
                // Else we add a new user into our Astatine List
                // console.log("Adding new wallet ", owner.address);
                let user = {
                  address: owner.address,
                  count: 1,
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
    }
    return weightedList;
}


get_24_hour_nft_transactions().then(nft_users => {
    console.log(nft_users);
    get_24_hour_qulaifying_data_transactions().then(data_upload_users => {
        console.log(data_upload_users);
        let existing_users = [];
        try {
            existing_users = JSON.parse(fs.readFileSync('existing_users.json'));
        } catch (e) {
            
        }
        
        const new_users_found = [];
        let nft_users_payments = 0;
        for(let i in nft_users) {
            const nft_user = nft_users[i];
            const nft_user_index = existing_users.findIndex(user_address => user_address == nft_user.address);
            nft_users_payments += nft_user.count;
            if(nft_user_index > 0) {
                console.log(`Found NFT from exisiting user ${nft_user.address}`);
            } else {
                existing_users.push(nft_user.address);
                const excluded_user_index = excluded_accounts.findIndex(user_address => user_address == nft_user.address);
                if(excluded_user_index == -1) {
                    new_users_found.push(nft_user.address);
                }
                
            }
        }

        for(let i in data_upload_users) {
            const data_upload_user = data_upload_users[i];
            const data_upload_user_index = existing_users.findIndex(user_address => user_address == data_upload_user.address);
            if(data_upload_user_index > 0) {
                console.log(`Found > 1gb file upload from exisiting user ${data_upload_user.address}`);
            } else {
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

        const total_token_shares = new_users_found.length + nft_users_payments + data_upload_users.length;
        const tokens_per_allocation = Math.ceil(total_daily_token_distribution_amount/total_token_shares);
        console.log(`Todays allocation is ${total_token_shares} shares of ${total_daily_token_distribution_amount} which is ${tokens_per_allocation} tokens per qualifying transaction`);

        fs.writeFileSync('existing_users.json', JSON.stringify(existing_users));
    })
});

const excluded_accounts = ['h-Bgr13OWUOkRGWrnMT0LuUKfJhRss5pfTdxHmNcXyw', 'OFD5dO06Wdurb4w5TTenzkw1PacATOP-6lAlfAuRZFk'];
