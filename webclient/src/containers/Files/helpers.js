import arweave from '../../arweave-config';
import settings from '../../app-config';
import { toast } from 'react-toastify';


export function createRootFolder(path_parts, index, file_info) {
    if(index == path_parts.length - 1) {
        return {...file_info, name: path_parts[index], index: index, type: "file"};
    } else {
        return {name: path_parts[index], index: index, type: "folder", children: [createRootFolder(path_parts, index + 1, file_info)]};
    }
}

export function addToFolderchildren(path_parts, index, file_info, path_obj) {
    if(index == path_parts.length - 1) {
        return path_obj.children.push({...file_info, name: path_parts[index], index: index, type: "file"});
    } else {
        const current_folder = path_parts[index];

        if(current_folder == path_obj.name) {
            addToFolderchildren(path_parts, index + 1, file_info, path_obj);
        } else {
            const matched_folders = path_obj.children.filter((folder) => folder.name == current_folder);

            if(matched_folders.length == 0) {
                const folder = {name: current_folder, index: index, type: "folder", children: []};
                path_obj.children.push(folder);

                addToFolderchildren(path_parts, index + 1, file_info, folder);
            } else {
                for(let i in matched_folders) {
                    const path = matched_folders[i];
                    addToFolderchildren(path_parts, index + 1, file_info, path);
                }
            }
        
        }
    }
}

export const getFiles = async (address) => {
    const tx_ids = await arweave.arql({
        op: "and",
        expr1: {
            op: "equals",
            expr1: "from",
            expr2: address
        },
        expr2: {
            op: "equals",
            expr1: "App",
            expr2: settings.APP_NAME
        }
    });

    const sw_tx_ids = await arweave.arql({
        op: "equals",
        expr1: "App-Name",
        expr2: "SmartWeaveContract"
    });
    
    const contracts = sw_tx_ids.slice(0, 20);

    // const txs = ['1TFZeEewEgUpqT5i2dsZSIRKJq3h1C7ZVi-gE8G-W6U']; 

    debugger;

    const tx_rows = await Promise.all(contracts.map(async (tx_id) => {
    
        let tx_row = {id: tx_id};
        
        var tx = await arweave.transactions.get(tx_id);
        
        tx.get('tags').forEach(tag => {
            let key = tag.get('name', { decode: true, string: true });
            let value = tag.get('value', { decode: true, string: true });
            
            if(key == "modified" || key == "version") {
                tx_row[key] = parseInt(value);
            } else {
                tx_row[key] = value;
            }
            
        });   

        return tx_row
    }));

    debugger;

    const final_rows = [];
    const folders = {};    

    for(let i in tx_rows) {
        const file_info = tx_rows[i];
        const in_final_rows = final_rows.filter((row) => row.path === file_info.path);

        let path_parts = [];
        if(file_info.path.indexOf('\\') != -1) {
            path_parts = file_info.path.split('\\')
        } 

        if(file_info.path.indexOf('/') != -1) {
            path_parts = file_info.path.split('/')
        }
        
        if(path_parts.length > 1) {
            if(folders.hasOwnProperty(path_parts[0])) {
                addToFolderchildren(path_parts, 0, file_info, folders[path_parts[0]], 0);                
            } else {
                folders[path_parts[0]] = createRootFolder(path_parts, 0, file_info);
            }
            
        }      
    }

    if(!folders.hasOwnProperty("")) {
        folders[""] = {name: "", children: [], index: 0, type: "folder"};
    }

    return folders;
}

export const SaveUploader = (uploader) => {
    const uploaders = GetUploaders();

    uploaders.push(uploader);

    localStorage.setItem("Evermore-uploaders", JSON.stringify(uploaders))
}

export const GetUploaders = () => {
    let uploaders = localStorage.getItem("Evermore-uploaders")

    if(uploaders == undefined || uploaders == null) {
        return [];
    }

    return JSON.parse(uploaders);
}

export const RemoveUploader = (uploader) => {
    const uploaders = GetUploaders();

    uploaders.push(uploader);

    localStorage.setItem("Evermore-uploaders", JSON.stringify(uploaders))
}

export const setFileStatusAsDeleted = async (file_info) => {
    const wallet_file = walletFileSet();

    if(!wallet_file || wallet_file.length == 0) return;

    const wallet_jwk = getJwkFromWalletFile(wallet_file);

    const transaction = await arweave.createTransaction({}, wallet_jwk);

    const wallet_balance = await getWalletBalance();

    const total_winston_cost = parseInt(transaction.reward);
    const total_ar_cost = arweave.ar.arToWinston(total_winston_cost);
    
    if(wallet_balance < total_ar_cost) {
        toast(`Your wallet does not contain enough AR to upload, ${total_ar_cost} AR is needed `, { type: toast.TYPE.ERROR });

        return;
    }

    transaction.addTag('App-Name', settings.APP_NAME);
    transaction.addTag('file', file_info.file.replace(/([^:])(\/\/+)/g, '$1/'));
    transaction.addTag('path', file_info.path.replace(/([^:])(\/\/+)/g, '$1/'));
    transaction.addTag('modified', file_info.modified);
    transaction.addTag('hostname', file_info.hostname);
    transaction.addTag('CRC', file_info.CRC);
    transaction.addTag('version', file_info.version);
    transaction.addTag('STATUS', "DELETED");
    transaction.addTag('ACTION_TIMESTAMP', new Date().getTime());

    await arweave.transactions.sign(transaction, wallet_jwk);

    const response = await arweave.transactions.post(transaction);

    if(response.status != 200) {
        let error_msg = null;

        if(response.status == 400) {
            error_msg = "The transaction was rejected as invalid.";
        }

        if(response.status == 500) {
            error_msg = "There was an error connecting to the blockchain.";
        }

        toast(`There was an error updating the status of ${file_info.name} - ${error_msg}`, { type: toast.TYPE.ERROR });

        return;
    }
}

// export const setFileStatusAsDeleted = async (file_info) => {
//     const wallet_file = walletFileSet();

//     if(!wallet_file || wallet_file.length == 0) return;

//     const wallet_jwk = getJwkFromWalletFile(wallet_file);

//     const transaction = await arweave.createTransaction({}, wallet_jwk);

//     const wallet_balance = await getWalletBalance();

//     const total_winston_cost = parseInt(transaction.reward);
//     const total_ar_cost = arweave.ar.arToWinston(total_winston_cost);
    
//     if(wallet_balance < total_ar_cost) {
//         toast(`Your wallet does not contain enough AR to upload, ${total_ar_cost} AR is needed `, { type: toast.TYPE.ERROR });

//         return;
//     }

//     transaction.addTag('App-Name', settings.APP_NAME);
//     transaction.addTag('file', file_info.file.replace(/([^:])(\/\/+)/g, '$1/'));
//     transaction.addTag('path', file_info.path.replace(/([^:])(\/\/+)/g, '$1/'));
//     transaction.addTag('modified', file_info.modified);
//     transaction.addTag('hostname', file_info.hostname);
//     transaction.addTag('CRC', file_info.CRC);
//     transaction.addTag('version', file_info.version);
//     transaction.addTag('STATUS', "UNDELETED");
//     transaction.addTag('ACTION_TIMESTAMP', new Date().getTime());

//     await arweave.transactions.sign(transaction, wallet_jwk);

//     const response = await arweave.transactions.post(transaction);

//     if(response.status != 200) {
//         let error_msg = null;

//         if(response.status == 400) {
//             error_msg = "The transaction was rejected as invalid.";
//         }

//         if(response.status == 500) {
//             error_msg = "There was an error connecting to the blockchain.";
//         }

//         toast(`There was an error updating the status of ${file_info.name} - ${error_msg}`, { type: toast.TYPE.ERROR });

//         return;
//     }
// }