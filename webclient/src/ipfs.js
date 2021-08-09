import settings from './app-config';
import { NFTStorage, File } from 'nft.storage';
import mime from 'mime-types';
const filesContractDefinition = require("./containers/NFT/artifacts/contracts/EvermoreFile.sol/EvermoreFile.json"); 
const FILES_CONTRACT_ADDRESS = '0x1eBB25669507EEf932b7E21E646E9556C13989d2';

export const listFilesFor = async (eth_address, web3) => {
    const filesContract = new web3.eth.Contract(filesContractDefinition.abi, FILES_CONTRACT_ADDRESS);
    const folders = {"": {children:[]}}; 
    folders[""] = {name: "", children: [
        {name: "Public", children: [], index: 0, type: "folder"},
        {name: "Photos", children: [], index: 0, type: "folder"},
        {name: "NFTs", children: [], index: 0, type: "folder"}
    ], index: 0, type: "folder"};

    try {
        const transactions = await filesContract.methods.getFilesFor(eth_address).call();

        for(let i in transactions) {
            // TODO: add files to folders
        }

        return folders;
    } catch (e) {
        debugger;
        console.log(e);
        return folders;
    }    
}

export const uploadFile = async (file_info, eth_address, web3, showSuccessNotification, showErrorNotification) => {
    const filesContract = new web3.eth.Contract(filesContractDefinition.abi, FILES_CONTRACT_ADDRESS);
    const ipfsClient = new NFTStorage({token: settings.NFT_STORAGE_API_KEY});
    
    try {
        const metadata = await ipfsClient.store({
            name: file_info.name,
            description: file_info.path,
            image: new File(file_info.file_data, file_info.name, { type: mime.lookup(file_info.file) })
        });

        debugger;

        await filesContract.methods.set(file_info.path, metadata.ipnft, file_info.modified).send({from: eth_address});

        showSuccessNotification(`${file_info.name} was successfully uploaded to IPFS. HASH ${metadata.ipnft}`);
    } catch (e) {
        showErrorNotification(`Unable to upload ${file_info.name} at this time. Try again later`);
    }
}
