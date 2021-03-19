const axios = require('axios');

async function report_users() {
    let cursor = '';
    let hasNextPage = true;
    const owners = {};
    let transactionsCount = 0;

    while(hasNextPage) {
        const query = `{
            transactions(
                tags: [
                {
                    name: "Application",
                    values: ["Evermore"]
                }
                ]
                after: "${cursor}"
                first: 100	) {
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
                    }
                }
            }
        }`;

        try {
            const response = await axios.post('https://arweave.net/graphql', {
                operationName: null,
                query: query,
                variables: {}
            });
        
        

            if(response.status == 200) {
                const data = response.data.data;

                for(let i in data.transactions.edges) {
                    const row = data.transactions.edges[i].node;

                    if(!owners.hasOwnProperty(row.owner.address)) {
                        owners[row.owner.address] = true;
                    } 

                    transactionsCount++;
                }

                hasNextPage = data.transactions.pageInfo.hasNextPage;

                if(hasNextPage) {
                    cursor = data.transactions.edges[data.transactions.edges.length - 1].cursor;
                }
            } else {
                hasNextPage = false;
            }

        } catch(e) {
            console.log(response);
            throw new Error(e);
        }
    }

    const owners_list = Object.keys(owners);

    console.log(`${owners_list.length} users and ${transactionsCount} txs`);
    console.log(owners_list);
}



report_users();