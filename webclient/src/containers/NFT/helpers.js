import arweave from '../../arweave-config';
import limestone from 'limestone-api';
import { readContract, selectWeightedPstHolder, interactWrite  } from 'smartweave';
import settings from '../../app-config';
import { toast } from 'react-toastify';

const PUBLIC_KEY = process.env.PUBLIC_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const NFT_DEBUG = false;
const NFT_CONTRACT_ADDRESS = NFT_DEBUG ? "0xcD77551246F275Af229bE93C1953357C577d2700" : "0xC29A432CD0A9fa202117Ed53FaD040b5Ccc48D35";
console.log(`NFT_CONTRACT_ADDRESS = ${NFT_CONTRACT_ADDRESS}`);
const contract = require("./artifacts/contracts/EvermoreNFT.sol/EvermoreNFT.json"); 

export const wasPublished = async (tx_id) => {
  try {
      const query = {
        query: `query {
        transactions(
          tags: [
              {
                  name: "EVERMORE_NFT_METADATA",
                  values: ["ETH NETWORK DATA"]
              },
              {
                  name: "NFT-Source",
                  values: ["${tx_id}"]
              }
          ]
        ) {
          edges {
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

      const response = await arweave.api.request().post('https://arweave.net/graphql', query);
      const { data } = response.data;
      const { transactions } = data;

      return transactions;
  } catch (err) {
      
      console.log (err);
      return null;
  }
}

const getMediumType = (nft) => {
  const contentTypeTag = nft['Content-Type'];

  if(contentTypeTag.indexOf('image') != -1) {
    return "Digital photograph and digital ink";
  } 

  if(contentTypeTag.indexOf('audio') != -1) {
    return "Digital audio";
  }  

  if(contentTypeTag.indexOf('video') != -1) {
    return "Digital video";
  }
} 

export const publishToETH = async (eth_address, transaction, wallet, web3) => {
  const imageURL = `https://arweave.net/${transaction.id}`;
  
  const name = transaction['Init-State'].name;
  const description = transaction['Init-State'].description;

  const metadata = {
      "name": name,
      "description": description,
      "image": imageURL,
      "attributes":[
        { name: "Medium", value: getMediumType(transaction) },
        { name: "Proof of Ownership", value: "Transaction Hash" },
        { name: "Edition", value: "1 of 1" },
      ]
  };

  const tx = await arweave.createTransaction({
      data: JSON.stringify(metadata)
  }, wallet);

  tx.addTag('EVERMORE_NFT_METADATA', 'ETH NETWORK DATA');
  tx.addTag('Content-Type', 'application/json');
  tx.addTag('NFT-Source', transaction.id);

  await arweave.transactions.sign(tx, wallet);
  await arweave.transactions.post(tx);

  const response = await mintNFT(`https://arweave.net/${tx.id}`, eth_address, web3);
  
  if(response) {
    await sendNFTMintCommunityPayment(wallet);

    toast(`${transaction.name} has been made available on the Ethereum network and its meta data will be mined shortly.`, { type: toast.TYPE.SUCCESS }); 
  } else {
    toast(`Publishing ${transaction.name} to the Ethereum network was cancelled.`, { type: toast.TYPE.ERROR }); 
  }
}

const sendNFTMintCommunityPayment = async (wallet) => {
  const price = await limestone.getPrice("AR");

  const payment_in_AR = settings.NFT_PUBLISH_COST_IN_USD / price.value; // community payment

  const contractState = await readContract(arweave, settings.CONTRACT_ADDRESS);

  const holder = selectWeightedPstHolder(contractState.balances);
  
  const tx = await arweave.createTransaction({ 
          target: holder, 
          quantity: arweave.ar.arToWinston(payment_in_AR)}
          , wallet);

  tx.addTag('EVERMORE_TOKEN', 'COMMUNITY REWARD PAYMENT (NFT PUBLISH)');
          
  await arweave.transactions.sign(tx, wallet);
  await arweave.transactions.post(tx);
  
  return tx;
}

const mintNFT = async (tokenURI, eth_address, web3) => {
  const nftContract = new web3.eth.Contract(contract.abi, NFT_CONTRACT_ADDRESS);
  //the transaction
  const tx = {
      'from': eth_address,
      'to': NFT_CONTRACT_ADDRESS,
      'nonce': 0x00,
      'gas': 500000,
      'data': nftContract.methods.mintNFT(eth_address, tokenURI).encodeABI()
  };

  

  try {
    return await nftContract.methods.mintNFT(eth_address, tokenURI).send(tx);
  } catch(e) {
    console.log(e);
    return false;
  }
  
}
