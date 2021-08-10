import settings from './app-config';
import { NFTStorage, File } from 'nft.storage';
import mime from 'mime-types';
const filesContractDefinition = require("./containers/NFT/artifacts/contracts/EvermoreFile.sol/EvermoreFile.json"); 
const FILES_CONTRACT_ADDRESS = '0xC1e019DE0aaBa5ADE60A2CC01924afa1c41D39e9';

const listFilesFor = (cache) => async (eth_address, web3) => {
    
    const cached = cache.get(eth_address);
    if (cached) {
        return cached;
    }

    const filesContract = new web3.eth.Contract(filesContractDefinition.abi, FILES_CONTRACT_ADDRESS);
    const folders = {"": {children:[]}}; 
    folders[""] = {name: "", children: [
        {name: "Public", children: [], index: 0, type: "folder"},
        {name: "Photos", children: [], index: 0, type: "folder"},
        {name: "NFTs", children: [], index: 0, type: "folder"}
    ], index: 0, type: "folder"};

    if(eth_address == null) return folders;

    try {
        const transactions = await filesContract.methods.getFilesFor(eth_address).call();

        for(let i in transactions) {
            const transaction = {...transactions[i]};
            const path_parts = transaction.path.split('/');
            transaction['modified'] = parseInt(transaction.timestamp);

            if(folders.hasOwnProperty(path_parts[0])) {
                addToFolderChildrenOrUpdate(path_parts, 0, transaction, folders[path_parts[0]], 0);                
            } else {
                folders[path_parts[0]] = createRootFolder(path_parts, 0, transaction);
            }
        }

        cache.delete(eth_address);
        cache.set(eth_address, folders);

        return folders;
    } catch (e) {
        debugger;
        console.log(e);
        return folders;
    }    
};

export default listFilesFor(new Map());

export function createRootFolder(path_parts, index, file_info) {
    if(index == path_parts.length - 1) {
        return {...file_info, name: path_parts[index], index: index, type: "file"};
    } else {
        return {name: path_parts[index], index: index, type: "folder", children: [createRootFolder(path_parts, index + 1, file_info)]};
    }
}

export function addToFolderChildrenOrUpdate(path_parts, index, file_info, path_obj) {
    if(index == path_parts.length - 1) {
        const matched = path_obj.children.filter(child => child.path == file_info.path);

        if(matched.length == 0) {
            const fi = {...file_info, name: path_parts[index], index: index, type: 'file', mining: false};
            return path_obj.children.push(fi);
        } else {
            const match = matched[0];

            if(match.type == 'folder') return;

            // TODO: is this ever needed? filtering duplicates is done earlier so this may never execute!
            if(match.modified <= file_info.modified) {
                match.modified = file_info.modified;
                match.tx_id = file_info.tx_id;
            }
        }
        
    } else {
        const current_folder = path_parts[index];

        if(current_folder == path_obj.name) {
            addToFolderChildrenOrUpdate(path_parts, index + 1, file_info, path_obj);
        } else {
            const matched_folders = path_obj.children.filter((folder) => folder.name == current_folder);

            if(matched_folders.length == 0) {
                const folder = {...file_info, name: current_folder, index: index, type: "folder", children: []};
                path_obj.children.push(folder);

                addToFolderChildrenOrUpdate(path_parts, index + 1, file_info, folder);
            }  else {
                for(let i in matched_folders) {
                    const path = matched_folders[i];
                    addToFolderChildrenOrUpdate(path_parts, index + 1, file_info, path);
                }
            }

        }
    }
}

export const uploadFile = async (file_info, eth_address, web3, showSuccessNotification, showErrorNotification) => {
    const filesContract = new web3.eth.Contract(filesContractDefinition.abi, FILES_CONTRACT_ADDRESS);
    const ipfsClient = new NFTStorage({token: settings.NFT_STORAGE_API_KEY});
    
    debugger;
    try {
        const metadata = await ipfsClient.store({
            name: file_info.name,
            description: file_info.path,
            image: new File(file_info.file_data, file_info.name, { type: mime.lookup(file_info.file) })
        });

        debugger;

        await filesContract.methods.set(file_info.path, metadata.ipnft, file_info.modified, file_info.file_size, file_info.hostname).send({from: eth_address});

        showSuccessNotification(`${file_info.name} was successfully uploaded to IPFS. HASH ${metadata.ipnft}`);
    } catch (e) {
        showErrorNotification(`Unable to upload ${file_info.name} at this time. Try again later`);
    }
}

export const uploadFileNFT = async (file_info, nft_details, eth_address, web3, showSuccessNotification, showErrorNotification) => {
    const filesContract = new web3.eth.Contract(filesContractDefinition.abi, FILES_CONTRACT_ADDRESS);
    const ipfsClient = new NFTStorage({token: settings.NFT_STORAGE_API_KEY});
    
    debugger;
    try {
        const metadata = await ipfsClient.store({
            name: nft_details.name,
            description: nft_details.description,
            image: new File(file_info.file_data, file_info.name, { type: mime.lookup(file_info.file) })
        });

        debugger;

        await filesContract.methods.set(file_info.path, metadata.ipnft, file_info.modified, file_info.file_size, file_info.hostname).send({from: eth_address});

        showSuccessNotification(`${file_info.name} was successfully uploaded to IPFS. HASH ${metadata.ipnft}`);
    } catch (e) {
        showErrorNotification(`Unable to upload ${file_info.name} at this time. Try again later`);
    }
}

export const publishToRaribile = (ipfsHash, eth_address, web3, showSuccessNotification, showErrorNotification) => {
    // TODO: publish using Rarible minter contracts
}
