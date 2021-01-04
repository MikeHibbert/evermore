const chokidar = require('chokidar');
const path = require('path');
const notifier = require('node-notifier');
import fileAddedHandler from './AddFile';
import fileChangedHandler from './ChangeFile';
import fileDeletedHandler from './DeleteFile';
import dirAddedHandler from './AddDir';
import dirDeletedHandler from './DeleteDir';
import { 
    GetAllPendingFiles, 
    GetPendingFilesWithTransactionIDs, 
    GetUploaders, 
    RemoveUploader,
    ResetPendingFile, 
    ConfirmSyncedFileFromTransaction,
    GetSyncStatus,
    GetSyncFrequency,
    GetAllProposedFiles, 
    GetProposedFile,
    GetProposedFileBy,
    GetSyncedFolders,
    AddPendingFile,
    RemoveProposedFile,
    GetDeletingFiles,
    UpdatePersistenceID,
    RemovePersistenceRecord,
    GetDeletedFiles, 
    GetDownloads, 
    walletFileSet,
    InDownloadQueue,
    GetSyncedFileBy
} from '../db/helpers';
import { 
    uploadFile, 
    finishUpload, 
    getTransactionStatus, 
    getDownloadableFilesGQL,
    transactionExistsOnTheBlockchain,
    getTransactionWithTags,
    createPersistenceRecord, 
    downloadFileFromTransaction, 
    confirmTransaction,
    checkInternet
} from '../crypto/arweave-helpers';
import {convertDatabaseRecordToInfos, getSystemPath, mergePathInfos} from './helpers';
import {openReviewSyncDialog, refreshReviewSyncDialog, processToQueues} from '../ui/ReviewSyncDialog';
import { settings } from '../config';
import { sendMessage } from '../integration/server';
import { GetPendingFile } from '../../dist/db/helpers';
import {showNotification} from '../ui/notifications';
import { updateFileMonitoringStatuses } from '../qt-system-tray';

let connectivity_check_interval = null;
export const OnFileWatcherReady = () => {
    console.log('Initial scan complete. Ready for changes');

    checkInternet(internetAvailableCallback);    
}

const internetAvailableCallback = (available) => {
    if(connectivity_check_interval) {
        clearInterval(connectivity_check_interval);
        connectivity_check_interval = null;
    }

    if(available) {
        const syncing = GetSyncStatus();

        if(syncing) {
            startSyncProcessing();
        }  

        startPendingTrasactionConfirmation();
    } else {
        connectivity_check_interval = setInterval(() => {
            checkInternet(internetAvailableCallback);   
        }, 30000); // check again in 30 seconds
    }        
}

let pending_transaction_confirmation_checking_interval = null
const startPendingTrasactionConfirmation = async () => {
    const pending_files = GetAllPendingFiles();

    if(pending_files.length > 0) {
        processAllPendingTransactions(pending_files);
    }

    const presistence_records = await GetDeletedFiles();

    presistence_records.forEach(async pr => {
        const response = await getTransactionStatus(pr.action_tx_id);

        if(response.status == 200 && response.confirmed.number_of_confirmations > 3) {
            RemovePersistenceRecord(pr.action_tx_id);
        }
    });

    updateFileMonitoringStatuses();

    pending_transaction_confirmation_checking_interval = setInterval(async () => {
        const pending_files = GetPendingFilesWithTransactionIDs();

        if(pending_files.length > 0) {
            processAllPendingTransactions(pending_files);
        }

        const presistence_records = await GetDeletedFiles();

        presistence_records.forEach(async pr => {
            const response = await getTransactionStatus(pr.action_tx_id);

            if(response.status == 200 && response.confirmed.number_of_confirmations > 3) {
                RemovePersistenceRecord(pr.action_tx_id);
            }
        });

        updateFileMonitoringStatuses();
    }, 1 * 60 * 1000); // check them every 10 mins
}

const processAll = () => {
    checkPendingFilesStatus();

    // processAllOutstandingUploadsAndActions(); disabled until we know its not causing upload duplicates

    const deleted_file_actions = GetDeletedFiles();

    processAllDeleteActions(deleted_file_actions);

    const pending_files = GetAllPendingFiles();

    processAllPendingFiles(pending_files);

    const downloads = GetDownloads();

    processAllDownloads(downloads);
}

let sync_processing_interval = null;
let initial_sync_inteval = null; // used to make a small delay at start up
export const startSyncProcessing = () => {
    initial_sync_inteval = setInterval(() => {
        checkSyncableFiles();
        processAll();
        clearInterval(initial_sync_inteval);

        sync_processing_interval = setInterval(() => {
            checkSyncableFiles();
        }, GetSyncFrequency() * 60 * 1000);
    }, 1 * 1000); // 10 second delay on first time to allow for file monitoring to catch up
}


export const stopSyncProcessing = () => {
    if(sync_processing_interval) {
        clearInterval(sync_processing_interval);
    }
}

export const unpauseSyncProcessing = () => {
    const syncing = GetSyncStatus();

    if(!syncing) return;
    
    sync_processing_interval = setInterval(() => {
        checkSyncableFiles();
    }, GetSyncFrequency() * 60 * 1000);
}

export const checkSyncableFiles = async () => {
    const syncable_files = await getAllSyncableFiles();

    if(syncable_files[''].children.length > 0) {
        const minutes = GetSyncFrequency();
        const notification = {
            title: 'Evermore Datastore',
            icon: settings.NOTIFY_ICON_PATH,
            message: `${syncable_files[''].children.length} files have been queued for sync in the last ${minutes} minutes. Would like to review them now?`,
            appID: undefined //settings.API_NOTIFIER_ID
        };

        // if(process.platform != 'darwin') {
        //     notification['actions'] = ['Review', 'Postpone'];
        // }

        notifier.notify({
                title: 'Evermore Datastore',
                icon: settings.NOTIFY_ICON_PATH,
                message: `${syncable_files[''].children.length} files have been queued for sync in the last ${minutes} minutes. Click to review.`,
                appID: settings.API_NOTIFIER_ID
            },
            function (err, response, metadata) {
                if(!err && response != 'timeout') reviewSyncableFiles();
        });
        // notifier.on('click', function (notifierObject, options, event) {
        //     console.log('clicked');
        // });
        // notifier.on('click', () => { 
        //     console.log('clicked');
        //     reviewSyncableFiles();
        // });

        // if(process.platform != 'darwin') {

        //     notifier.on('click', () => { reviewSyncableFiles() });

        //     notifier.on('postpone', () => {
        //         // console.log('"Postpone" was pressed');
        //     });
        // } else {
        //     notifier.on('click', reviewSyncableFiles);
        // }
    }
}

export const reviewSyncableFiles = async () => {
    const syncable_files = await getAllSyncableFiles();

    if(syncable_files[''].children.length == 0) {
        const notification = {
            title: 'Evermore Datastore',
            icon: settings.NOTIFY_ICON_PATH,
            message: 'There are no files that need reviewing.',
            appID: settings.API_NOTIFIER_ID
        };
        notifier.notify(notification);

        return;
    }

    prepareSyncDialogResponse(syncable_files);
}


export const pauseSyncProcessing = () => {
    const syncing = GetSyncStatus();

    if(!syncing) return;

    if(sync_processing_interval) {
        clearInterval(sync_processing_interval);
    }
}

const checkPendingFilesStatus = () => {
    const pending_files = GetPendingFilesWithTransactionIDs();

    let confirmed_count = 0;

    for(let i in pending_files) {
        const file_info = pending_files[i];

        getTransactionStatus(file_info.tx_id).then(async (response) => {
            if(response.status == 404) {
                console.log(`resetting pending file ${file_info.file} as it was not found on the blockchain`);
                ResetPendingFile(file_info.path, file_info.modified);
            }

            if(response.status == 200) {
                const transaction = await getTransactionWithTags(file_info.tx_id)
                ConfirmSyncedFileFromTransaction(file_info.path, transaction);
                sendMessage(`STATUS:OK:${file_info.path}\n`);
                confirmed_count++;
            }
        });
    }

    if(confirmed_count > 0) {
        showNotification(`${confirmed_count} files have successfully been mined and are now permanently stored on the blockchain.`);
    }
}

const processAllOutstandingUploadsAndActions = async () => {
    const uploaders = GetUploaders();

    for(let i in uploaders) {
        const uploader_record = uploaders[i];
        const already_completed = await transactionExistsOnTheBlockchain(uploader_record.uploader.transaction.id);

        if(!already_completed) {
            const twenty_minutes_ago = new Date();
            twenty_minutes_ago.setMinutes(new Date().getMinutes() - 20);
            const twenty_minutes_ago_timestamp = twenty_minutes_ago.getTime();
            const time_difference = twenty_minutes_ago_timestamp - uploader_record.created;

            if(twenty_minutes_ago_timestamp < uploader_record.created) {
                finishUpload(uploader_record.uploader);

                RemoveUploader(uploader_record);
            }
            
        } else {
            RemoveUploader(uploader_record);
        }        
    }
}

const getAllSyncableFiles = async () => {
    const proposed_files = GetAllProposedFiles();
    proposed_files.forEach(pf => {
        pf['action'] = 'upload';
    });

    const sync_folder = GetSyncedFolders()[0];

    let syncable_files = convertDatabaseRecordToInfos(sync_folder, proposed_files)

    let downloadable_files = await getDownloadableFilesGQL();

    downloadable_files = downloadable_files.filter(downloadable_file => {
        const in_downloads = InDownloadQueue(downloadable_file);
        const synced_file = GetSyncedFileBy({path: downloadable_file.path});
        const pending_file = GetPendingFile(downloadable_file.path)

        if(pending_file || synced_file) {
            return false;
        }

        const synced_file_matches = GetSyncedFileBy({path: downloadable_file.path});

        if(synced_file_matches) {
            if(Array.isArray(synced_file_matches)) {
                const older_synced_files = synced_file_matches.filter(sf => sf.modified < downloadable_file.modified);

                return !in_downloads && older_synced_files.length > 0;
            } else {
                return !in_downloads && synced_file_matches.modified < downloadable_file.modified;
            }            
        } 

        return !in_downloads && synced_file_matches == undefined;
    });

    if(downloadable_files.length > 0) {
        syncable_files = mergePathInfos(syncable_files[''], convertDatabaseRecordToInfos(sync_folder, downloadable_files)['']);
    }

    const deleting_files = GetDeletingFiles();
    if(deleting_files.length > 0) {
        deleting_files.forEach(pf => {
            pf['action'] = 'delete';
        });
        syncable_files = mergePathInfos(syncable_files[''], convertDatabaseRecordToInfos(sync_folder, deleting_files)['']);
    }

    return syncable_files;
}

let sync_settings_dialog_open = false;

const prepareSyncDialogResponse = (path_infos) => {
    if(sync_settings_dialog_open) {
        refreshReviewSyncDialog(path_infos[''], reviewSyncHandler,
        () => {
            sync_settings_dialog_open = false;
        });
    } else {
        sync_settings_dialog_open = true;
        openReviewSyncDialog(path_infos[''], reviewSyncHandler,
        () => {
            sync_settings_dialog_open = false;
        });
    }
    
}

const reviewSyncHandler = async (path_infos_to_be_synced) => {
    pauseSyncProcessing();  

    await processToQueues(path_infos_to_be_synced);

    processAll();

    unpauseSyncProcessing();
        
    sync_settings_dialog_open = false;
}

const addPathInfosToPending = (path_infos) => { // TODO: is this still used?
    const sync_folders = GetSyncedFolders();
    const sync_folder = sync_folders[0];

    for(let i in path_infos.children) {
        const pa = path_infos.children[i];

        if(pa.type == 'folder') {
            addPathInfosToPending(pa);
        } else {
            if(pa.checked) {
                const proposed_file = GetProposedFileBy({path: pa.path});
                AddPendingFile(null, pa.path, proposed_file.version, proposed_file.is_update);
                RemoveProposedFile(pa.path);
            }            
        }
    }
}

const processAllPendingFiles = async (pending_files) => {
    let uploaded_count = 0;

    for(let i in pending_files) {
        const pending_file = pending_files[i];
        const pf = GetPendingFile(pending_file.path); // check to see if its already begun to upload.
        debugger;
        if(pf.tx_id == null) {            
            const encrypt_file = pending_file.path.indexOf('/Public/') == -1;

            await uploadFile(pending_file, encrypt_file);

            uploaded_count++;
        } else {
            const confirmed = await confirmTransaction(pending_file.tx_id);
            const transaction = getTransactionWithTags(pending_file.tx_id);

            if(confirmed && transaction) {
                transaction['is_update'] = pending_file.is_update;
                ConfirmSyncedFileFromTransaction(pending_file.path, transaction);
                sendMessage(`STATUS:OK:${pending_file.path}\n`);
            }
        }
            
    }

    if(uploaded_count > 0) {
        showNotification(`${pending_files.length} have been uploaded and will be mined sortly.`)
    }     
}

const processAllDeleteActions = async (deleted_files) => {
    deleted_files.forEach(async df => {
        if(!df.action_tx_id) {
            const tx_id = await createPersistenceRecord(df, true);

            UpdatePersistenceID(df.file, tx_id);
        }        
    });
}

const processAllDownloads = (downloads) => {
    downloads.forEach(download => {
        downloadFileFromTransaction(download.tx_id);        
    });
}

const processAllPendingTransactions = async (pending_files) => {
    let confirmed_count = 0;

    const public_sync_folder = path.join(getSystemPath(), 'Public');

    for(let i in pending_files) {
        if(!pending_files[i].tx_id) continue;

        const exists_on_the_blockchain = await confirmTransaction(pending_files[i].tx_id);

        if(exists_on_the_blockchain) {
            const transaction = await getTransactionWithTags(pending_files[i].tx_id);
            const file_path = pending_files[i].path;
            
            ConfirmSyncedFileFromTransaction(file_path, transaction);
            
            sendMessage(`UNREGISTER_PATH:${file_path}\n`);

            confirmed_count++;
        }       
    }

    if(confirmed_count > 0) {
        showNotification(`${confirmed_count} have been successfully mined and are available on the blockchain.`);
    } 
}

export const InitFileWatcher = (sync_folders) => {
    chokidar.watch(sync_folders)
    .on('add', path => fileAddedHandler(path))
    .on('change', path => fileChangedHandler(path))
    .on('unlink', path => fileDeletedHandler(path))
    .on('addDir', path => dirAddedHandler(path))
    .on('unlinkDir', path => dirDeletedHandler(path))
    .on('error', error => log(`Watcher error: ${error}`))
    .on('ready', () => OnFileWatcherReady());
}