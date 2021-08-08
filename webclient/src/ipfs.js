import settings from './app-config';
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

export const uploadFile = (file_info, eth_address, messageCallback, showSuccessNotification, showErrorNotification) => {

}
