import axios from 'axios';
import fs from 'fs';
import settings from './app-config';
import { NFTStorage, File } from 'nft.storage';
import mime from 'mime-types';
import rarepressMint from './rarepress'
const filesContractDefinition = require("./containers/NFT/artifacts/contracts/EvermoreFile.sol/EvermoreFile.json"); 
const FILES_CONTRACT_ADDRESS = '0xAB53312382dA5c14669AEb5b05B32db64240412a';

export const testAuthentication = (errorMsg) => {
    const url = `https://api.pinata.cloud/data/testAuthentication`;
    return axios
        .get(url, {
            headers: {
                'pinata_api_key': settings.PINATA_STORAGE_API_KEY,
                'pinata_secret_api_key': settings.PINATA_SECRET_API_KEY
            }
        })
        .then(function (response) {
            console.log(response);
        })
        .catch(function (error) {
            errorMsg(error);
        });
};

const pinFileToIPFS = async (file_info, errorMsg) => {
    testAuthentication(errorMsg);

    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
    //we gather a local file from the API for this example, but you can gather the file from anywhere
    let data = new FormData();
    data.append('file', file_info.file_handle);
    return axios.post(url,
        data,
        {
            maxContentLength: -1,
            headers: {
                'Content-Type': `multipart/form-data; boundary= ${data._boundary}`,
                'pinata_api_key': settings.PINATA_STORAGE_API_KEY,
                'pinata_secret_api_key': settings.PINATA_SECRET_API_KEY
            }
        }
    ).then(function (response) {
        return response;
        //handle response here
    }).catch(function (error) {
        //handle error here
        errorMsg(error);
    });
};

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
            transaction['Content-Type'] = transaction.content_type;
            transaction['tx_id'] = transaction.hash;

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

export const uploadFile = async (file_info, eth_address, web3, messageCallback, showSuccessNotification, showErrorNotification) => {
    const filesContract = new web3.eth.Contract(filesContractDefinition.abi, FILES_CONTRACT_ADDRESS);
    // const ipfsClient = new NFTStorage({token: settings.NFT_STORAGE_API_KEY});
    
    try {
        messageCallback({action: 'uploading', uploading: true});
        messageCallback({action: 'progress', progress: 10});

        // const metadata = await ipfsClient.storeBlob({
        //     name: file_info.name,
        //     description: file_info.path,
        //     image: file_info.file_handle
        // });

        const metadata = await pinFileToIPFS(file_info, showErrorNotification);

        console.log('IPFS URL for the metadata:', metadata.data)
        console.log('metadata.json contents:\n', metadata.data.IpfsHash)

        file_info['Content-Type'] = mime.lookup(file_info.file);

        messageCallback({action: 'progress', progress: 75});

        filesContract.methods.set(file_info.path, metadata.data.IpfsHash, file_info.modified, file_info.file_size, file_info.hostname, mime.lookup(file_info.file)).send({from: eth_address})
            .then(() => {
                debugger;
                messageCallback({action: 'progress', progress: 100});
                messageCallback({action: 'uploading', uploading: false});
                messageCallback({action: 'upload-complete', tx_id: metadata.data.IpfsHash});

                showSuccessNotification(`${file_info.name} was successfully mined on the blockchain`);
            });        
        
    } catch (e) {
        console.log(e);
        showErrorNotification(`Unable to upload ${file_info.name} at this time. Try again later`);
    }
}

export const uploadFileNFT = async (file_info, eth_address, web3, messageCallback, showSuccessNotification, showErrorNotification) => {
    const filesContract = new web3.eth.Contract(filesContractDefinition.abi, FILES_CONTRACT_ADDRESS);
    const ipfsClient = new NFTStorage({token: settings.NFT_STORAGE_API_KEY});

    try {
        messageCallback({action: 'uploading', uploading: true});
        messageCallback({action: 'progress', progress: 25});

        const ipfsHash = await publishToRaribile(file_info.file_data, file_info.nft.name, file_info.nft.description, showSuccessNotification, showErrorNotification);

        file_info['Content-Type'] = mime.lookup(file_info.file);

        messageCallback({action: 'progress', progress: 50});

        filesContract.methods.set(file_info.path, ipfsHash, file_info.modified, file_info.file_size, file_info.hostname, mime.lookup(file_info.file)).send({from: eth_address})
            .then(() => {
            debugger;
            messageCallback({action: 'progress', progress: 100});
            messageCallback({action: 'uploading', uploading: false});
            messageCallback({action: 'upload-complete', tx_id: ipfsHash});

            showSuccessNotification(`${file_info.name} was successfully mined on the blockchain`);
        }); 
        
    } catch (e) {
        console.log(e);
        showErrorNotification(`Unable to upload ${file_info.name} at this time. Try again later`);
    }
}

export const publishToRaribile = async (file_data, name, description, showSuccessNotification, showErrorNotification) => {
    try {
        const ipfsHash =await rarepressMint(file_data, name, description);
        showSuccessNotification(`${name} was successfully published to Rarible`);
        
        return ipfsHash;
    } catch (e) {
        console.log(`publishToRaribile : ${e}`);
        showErrorNotification(`Unable to publish ${name} to Rarible.`)
    }
}
