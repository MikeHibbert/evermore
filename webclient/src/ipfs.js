import settings from './app-config';
const filesContractDefinition = require("./containers/NFT/artifacts/contracts/EvermoreFile.sol/EvermoreFile.json"); 
const FILES_CONTRACT_ADDRESS = '0x62396F9635076B30F6a49bc9964cc88cd15CA2D2';


export const listFilesFor = async (eth_address, web3) => {
    const filesContract = new web3.eth.Contract(filesContractDefinition.abi, FILES_CONTRACT_ADDRESS);

    try {
        return await filesContract.methods.getFilesFor(eth_address);
    } catch (e) {
        console.log(e);
        return [];
    }    
}

export const uploadFile = (file_info, eth_address, messageCallback, showSuccessNotification, showErrorNotification) => {

}
