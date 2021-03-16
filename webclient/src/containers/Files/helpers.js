import arweave from '../../arweave-config';
import {interactRead} from 'smartweave';
import settings from '../../app-config';
import { toast } from 'react-toastify';


export function createRootFolder(path_parts, index, file_info) {
    if(index == path_parts.length - 1) {
        return {...file_info, name: path_parts[index], index: index, type: "file"};
    } else {
        return {name: path_parts[index], index: index, type: "folder", children: [createRootFolder(path_parts, index + 1, file_info)]};
    }
}

export function addFolderInfoToPathInfos(folder_name, path_parts, index, file_info) {
    if(index == path_parts.length - 1) {
        file_info.children.push({
            name: folder_name,
            type: 'folder',
            children: []
        })
    } else {
        const child_file_infos = file_info.children.filter(fi => fi.name == path_parts[index + 1] && fi.type == 'folder');

        addFolderInfoToPathInfos(folder_name, path_parts, index + 1, child_file_infos[0])
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

export const getFileWith = async (tx_id) => {
    var tx = await arweave.transactions.get(tx_id);
        
    const tx_row = {};

    tx.get('tags').forEach(tag => {
        let key = tag.get('name', { decode: true, string: true });
        let value = tag.get('value', { decode: true, string: true });
        
        if(key == "modified" || key == "version") {
            tx_row[key] = parseInt(value);
        } else {
            tx_row[key] = value;
        }
        
    });   

    return tx_row;
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
            expr1: "App-Name",
            expr2: settings.APP_NAME
        }
    });

    console.log(settings.APP_NAME);

    let tx_rows = await Promise.all(tx_ids.map(async (tx_id) => {
    
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

    tx_rows = createRecentFilesCollection(tx_rows);

    const final_rows = [];
    const folders = {"": {children:[]}};    

    for(let i in tx_rows) {
        const file_info = tx_rows[i];
        const child_matches = folders[''].children.filter((row) => row.file === file_info.file);

        if(child_matches.length == 0) {
            let path_parts = [];
            if(file_info.path.indexOf('\\') != -1) {
                path_parts = file_info.file.split('\\')
            } 

            if(file_info.path.indexOf('/') != -1) {
                path_parts = file_info.file.split('/')
            }
            
            if(path_parts.length > 1) {
                if(folders.hasOwnProperty(path_parts[0])) {
                    addToFolderchildren(path_parts, 0, file_info, folders[path_parts[0]], 0);                
                } else {
                    folders[path_parts[0]] = createRootFolder(path_parts, 0, file_info);
                }
                
            }  
        } else {

        }
            
    }

    if(!folders.hasOwnProperty("")) {
        folders[""] = {name: "", children: [], index: 0, type: "folder"};
    }

    return folders;
}

const createRecentFilesCollection = (tx_rows) => {
    const collection = {};

    tx_rows.forEach(tx_row => {
        const in_collection = collection.hasOwnProperty(tx_row.file);

        if(!in_collection) {
            collection[tx_row.file] = tx_row;
        } else {
            const collect_version = collection[tx_row.file];
            if(collect_version.modified < tx_row.modified) {
                collection[tx_row.file] = tx_row;
            }
        }
    })

    const final_rows = [];
    Object.keys(collection).forEach(key => {
        final_rows.push(collection[key]);
    });

    return final_rows;
}

const getTransferredNFTs = (address, wallet) => {

}

export const escapeText = function (str) {
    return str
        .replace(/[\\]/g, '')
        .replace(/[\/]/g, '')
        .replace(/[\b]/g, '')
        .replace(/[\f]/g, '')
        .replace(/[\n]/g, '')
        .replace(/[\r]/g, '')
        .replace(/[\t]/g, '');
};

export const getDownloadableFilesGQL = async (address, wallet) => {
    let hasNextPage = true;
    let cursor = '';
    const transactions = {};

    const folders = {"": {children:[]}}; 
    folders[""] = {name: "", children: [
        {name: "Public", children: [], index: 0, type: "folder"},
        {name: "Photos", children: [], index: 0, type: "folder"},
        {name: "NFTs", children: [], index: 0, type: "folder"}
    ], index: 0, type: "folder"};

    while(hasNextPage) {
        const query = `{
            transactions(
                first: 100
                owners: ["${address}"]
                tags: [
                {
                    name: "App-Name",
                    values: ["${settings.APP_NAME}", "SmartWeaveContract", "SmartWeaveAction"]
                }
                ]
                after: "${cursor}"
                ) {
                pageInfo {
                    hasNextPage
                }
                edges {
                    cursor
                    node {
                        id
                        tags {
                            name
                            value
                        }
                    }
                }
                
              }
        }`;
    
        const response = await arweave.api.request().post(settings.GRAPHQL_ENDPOINT, {
            operationName: null,
            query: query,
            variables: {}
        });        
    
        if(response.status == 200) {            
            const data = response.data.data;
            for(let i in data.transactions.edges) {
                const row = data.transactions.edges[i].node;
    
                row['tx_id'] = row.id;
    
                for(let i in row.tags) {
                    const tag = row.tags[i];

                    if(tag.name == 'Init-State') {
                        tag.value = escapeText(tag.value);
                    }
    
                    if(tag.name == 'version' || tag.name == 'modified' || tag.name == 'created' || tag.name == 'key_size') {
                        row[tag.name] = parseInt(tag.value);
                    } else {
                        row[tag.name] = tag.value;
                    }
                }

                
    
                if(row['Content-Type'] == "PERSISTENCE") continue;

                if(row['App-Name'] == "SmartWeaveContract" || row['App-Name'] == "SmartWeaveAction") {
                    
                    if(row['App-Name'] == "SmartWeaveContract") {
                        try {
                            const state = await interactRead(arweave, wallet, row.id, {function: 'balance'});
                            if(state.balance == 0) {
                                continue;
                            }
                        } catch(e) {
                            console.log(e);
                            continue;
                        }
                    } else {
                        if(row['Action'] == 'Transfer') {
                            try {
                                
                                const state = await interactRead(arweave, wallet, row.Contract, {function: 'balance'});

                                if(state.balance != 1) {
                                    continue;
                                } else {
                                    
                                    const tx = await arweave.transactions.get(row.Contract);
                                    
                                    tx.get('tags').forEach(tag => {
                                        let key = tag.get('name', { decode: true, string: true });
                                        let value = tag.get('value', { decode: true, string: true });
                                        
                                        if(key == "modified" || key == "version" || key == "file_size") {
                                            row[key] = parseInt(value);
                                        } else {
                                            row[key] = value;
                                        }
                                        
                                    }); 
                                }
                            } catch(e) {
                                console.log(e);
                                continue;
                            }
                        } else {
                            continue;
                        }
                    }
                }
    
                if(!row.hasOwnProperty('file')) continue;

                if(transactions.hasOwnProperty(row['file'])) {
                    const existing_tx = transactions[row['file']];
                    if(existing_tx.modified < row.modified && row['Content-Type'] != 'PERSISTENCE') {
                        transactions[row['file']] = row;
                    }
                } else {
                    if(row['Content-Type'] != 'PERSISTENCE') {
                        transactions[row['file']] = row;
                    }
                }
            }
    
            hasNextPage = data.transactions.pageInfo.hasNextPage;

            if(hasNextPage) {
                cursor = data.transactions.edges[data.transactions.edges.length - 1].cursor;
            }
        }        
    }

    hasNextPage = true;
    cursor = '';

    while(hasNextPage) {
        const query = `{
            transactions(
                first: 100
                owners: ["${address}"]
                tags: [
                {
                    name: "Application",
                    values: ["Evermore"]
                }
                ]
                after: "${cursor}"
                ) {
                pageInfo {
                    hasNextPage
                }
                edges {
                    cursor
                    node {
                        id
                        tags {
                            name
                            value
                        }
                    }
                }
                
              }
        }`;
    
        const response = await arweave.api.request().post(settings.GRAPHQL_ENDPOINT, {
            operationName: null,
            query: query,
            variables: {}
        });       
    
        if(response.status == 200) {
            const data = response.data.data;
            
            for(let i in data.transactions.edges) {
                const row = data.transactions.edges[i].node;
    
                row['tx_id'] = row.id;
    
                for(let i in row.tags) {
                    const tag = row.tags[i];
    
                    if(tag.name == 'version' || tag.name == 'modified' || tag.name == 'created' || tag.name == 'key_size') {
                        row[tag.name] = parseInt(tag.value);
                    } else {
                        row[tag.name] = tag.value;
                    }
                }
    
                if(row['Content-Type'] == "PERSISTENCE") continue;

                if(row['App-Name'] == "SmartWeaveContract" || row['App-Name'] == "SmartWeaveAction") {
                    
                    if(row['App-Name'] == "SmartWeaveContract") {
                        try {
                            const state = await interactRead(arweave, wallet, row.id, {function: 'balance'});
                            if(state.balance == 0) {
                                continue;
                            }

                            const existing_tx = transactions[row['file']];
                            if(existing_tx.created > row.created && row['Content-Type'] != 'PERSISTENCE') {
                                transactions[row['file']] = row;
                            }

                        } catch(e) {
                            console.log(e);
                            continue;
                        }
                    } else {
                        if(row['Action'] == 'Transfer') {
                            try {
                                
                                const state = await interactRead(arweave, wallet, row.Contract, {function: 'balance'});

                                if(state.balance != 1) {
                                    continue;
                                } else {
                                    
                                    const tx = await arweave.transactions.get(row.Contract);
                                    
                                    tx.get('tags').forEach(tag => {
                                        let key = tag.get('name', { decode: true, string: true });
                                        let value = tag.get('value', { decode: true, string: true });
                                        
                                        if(key == "modified" || key == "version" || key == "file_size") {
                                            row[key] = parseInt(value);
                                        } else {
                                            row[key] = value;
                                        }
                                        
                                    }); 

                                    const existing_tx = transactions[row['file']];
                                    if(existing_tx.created > row.created && row['Content-Type'] != 'PERSISTENCE') {
                                        transactions[row['file']] = row;
                                    }
                                }
                            } catch(e) {
                                console.log(e);
                                continue;
                            }
                        } else {
                            continue;
                        }
                    }
                }
                
                if(!row.hasOwnProperty('file')) continue;

                if(transactions.hasOwnProperty(row['file'])) {
                    
                    const existing_tx = transactions[row['file']];
                    if(existing_tx.created > row.created && row['Content-Type'] != 'PERSISTENCE') {
                        transactions[row['file']] = row;
                    }
                } else {
                    if(row['Content-Type'] != 'PERSISTENCE') {
                        transactions[row['file']] = row;
                    }
                }
            }
    
            hasNextPage = data.transactions.pageInfo.hasNextPage;

            if(hasNextPage) {
                cursor = data.transactions.edges[data.transactions.edges.length - 1].cursor;
            }
        }        
    }
    
    const persistence_records = await getPersistenceRecords(address);

    Object.keys(transactions).forEach(file_name => {
        const available_row = transactions[file_name];
        const persistence_matches = persistence_records.filter(pr => pr.action_tx_id == available_row.id);

        let current_persistence_state = 'available';

        persistence_matches.forEach(pm => {
            if(pm.action == 'delete') {
                current_persistence_state = 'deleted';
            } else {
                current_persistence_state = 'available';
            }
        });

        if(current_persistence_state == 'available') {
            let path_parts = ['', available_row.file];

            if(available_row.file.indexOf('/') != -1) {
                path_parts = available_row.file.split('/')
            }
            

            if(folders.hasOwnProperty(path_parts[0])) {
                addToFolderChildrenOrUpdate(path_parts, 0, available_row, folders[path_parts[0]], 0);                
            } else {
                folders[path_parts[0]] = createRootFolder(path_parts, 0, available_row);
            }
        }    
    });

    return folders;
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

export const convertPersistenceRecordsToDeletedFileInfos = (persistence_records) => {

    const folders = {"": {children:[]}}; 
    folders[""] = {name: "", children: [], index: 0, type: "folder"};

    const current_file_states = {};
    
    persistence_records.forEach(pr => {
        if(current_file_states.hasOwnProperty(pr.file)) {
            const current_file = current_file_states[pr.file];
            if(current_file.modified < pr.modified) {
                current_file_states[pr.file] = pr;
            }
        } else {
            current_file_states[pr.file] = pr;
        }
    })
    
    Object.keys(current_file_states).forEach(key => {
        const available_row = current_file_states[key];

        if(available_row.action == 'delete') {
            let path_parts = [];
            if(available_row.file.indexOf('\\') != -1) {
                path_parts = available_row.file.split('\\')
            } 

            if(available_row.file.indexOf('/') != -1) {
                path_parts = available_row.file.split('/')
            }
            
            if(path_parts.length > 1) {
                if(folders.hasOwnProperty(path_parts[0])) {
                    addToFolderchildren(path_parts, 0, available_row, folders[path_parts[0]], 0);                
                } else {
                    folders[path_parts[0]] = createRootFolder(path_parts, 0, available_row);
                }
                
            } 
        }    
    });

    return folders;
}

export const createPersistenceRecord = async (synced_file, deleted, wallet_jwk) => {
    const transaction = await arweave.createTransaction({data:'PERSISTENCE_RECORD'}, wallet_jwk);

    transaction.addTag('App-Name', settings.APP_NAME);
    transaction.addTag('Content-Type', 'PERSISTENCE');
    transaction.addTag('file', synced_file.file.replace(/([^:])(\/\/+)/g, '$1/'));
    transaction.addTag('path', synced_file.path.replace(/([^:])(\/\/+)/g, '$1/'));
    transaction.addTag('modified', synced_file.modified);
    transaction.addTag('hostname', synced_file.hostname);
    transaction.addTag('version', synced_file.version);

    transaction.addTag('action_tx_id', synced_file.tx_id);
    
    if(deleted) {
        transaction.addTag('action', "DELETE");
    } else {
        transaction.addTag('action', "UNDELETE");
    }

    await arweave.transactions.sign(transaction, wallet_jwk);

    const response = await arweave.transactions.post(transaction);

    if(response.status == 200) {
        return transaction.id;
    }
    
    return null;
} 

export const getPersistenceRecords = async (address) => {
    const query = `{
        transactions(
            first: 100
            owners: ["${address}"],
              tags: [
              {
                  name: "App-Name",
                  values: ["${settings.APP_NAME}"]
              },
              {
                name: "Content-Type",
                values: ["PERSISTENCE"]
              }
              ]	) {
              edges {
                  node {
                    id
                    tags {
                        name
                        value
                    }
                  }
              }
          }
    }`;

    const response = await arweave.api.request().post(settings.GRAPHQL_ENDPOINT, {
        operationName: null,
        query: query,
        variables: {}
    });

    if(response.status == 200) {
        const final_rows = [];

        for(let i in response.data.data.transactions.edges) {
            const row = response.data.data.transactions.edges[i].node;

            

            for(let i in row.tags) {
                const tag = row.tags[i];
                if(tag.name == 'version' || tag.name == 'modified') {
                    row[tag.name] = parseInt(tag.value);
                } else {
                    if(tag.name == 'tx_id') {
                        row['action_tx_id'] = tag.value;
                    }
                    row[tag.name] = tag.value;
                }
                if(tag.name == 'action') {
                    row['action'] = tag.value == 'DELETE' ? 'delete' : 'download';
                }
            }

            final_rows.push(row);
        }

        return final_rows;
    }
}

export const SaveUploader = (uploader) => {
    const uploaders = GetUploaders();

    uploaders.push(uploader);

    sessionStorage.setItem("Evermore-uploaders", JSON.stringify(uploaders))
}

export const GetUploaders = () => {
    let uploaders = sessionStorage.getItem("Evermore-uploaders")

    if(uploaders == undefined || uploaders == null) {
        return [];
    }

    return JSON.parse(uploaders);
}

export const RemoveUploader = (uploader) => {
    const uploaders = GetUploaders();

    uploaders.push(uploader);

    sessionStorage.setItem("Evermore-uploaders", JSON.stringify(uploaders))
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
//     transaction.addTag('STATUS', "DELETED");
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