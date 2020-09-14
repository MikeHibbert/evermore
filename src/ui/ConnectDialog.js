const dialog = require('dialog-node');
const path = require('path');
import {createLoggedInSystray} from '../qt-system-tray';
import {InitFileWatcher} from '../fsHandling/Init';
import {getSyncPathInfos} from '../fsHandling/helpers';
import {getWalletBalance} from '../crypto/arweave-helpers';
import {
    setWalletFilePath, 
    AddSyncedFolder, 
    AddPendingFile,
    ConfirmSyncedFileFromTransaction
} from '../db/helpers';
import openSyncSettingsDialog from './SyncSettingsDialog';

let systray = null;

const configureWithPathsFromInfo = (path_info) => {
    const paths = [];
    path_info.children.forEach(pi => {
        if(pi.type == 'folder') {
            configureWithPathsFromInfo(pi);
        } else {
            if(pi.checked) {
                const online_versions = getOnlineVersions(pi);
                if(!online_versions) {
                    AddPendingFile(null, pi.path, 1);
                } else {
                    online_versions.sort((a, b) => a.modified - b.modified);

                    const online_version = online_versions[online_versions.length - 1];

                    ConfirmSyncedFileFromTransaction(pi.path, online_version);
                }
            }            
        }
    })
}

const selectFolderCallback = (code, retVal, stderr) => {
    console.log(retVal);
    if(retVal.length == 0) return;

    AddSyncedFolder(retVal.replace('\r\n', ''));

    const path_infos = getSyncPathInfos((path_infos) => {
        if(path_infos[''].children.length > 0) {
            openSyncSettingsDialog(path_infos[''], (pis) => {
                configureWithPathsFromInfo(pis[''])
            },
            (pis) => {
                configureWithPathsFromInfo(pis[''])
            });
        }        
    });

    

    InitFileWatcher(retVal.replace('\r\n', ''));

    createLoggedInSystray()
}

var selectFileCallback = (code, retVal, stderr) => {
    if(retVal.length == 0) return;

    const path = retVal.replace('\r\n', '');

    setWalletFilePath(path);

    dialog.folderselect(
        "Please select the folder you would like to backup",
        "Please select the folder you would like to backup", 
        0, 
        selectFolderCallback
    );

    // console.log("return value = <" + path + ">");
}

const openConnectDialog = (oldSystray, action) => {
    systray = oldSystray;

    dialog.fileselect(
        "Please select a wallet file to begin saving your data.",
        "Please select a wallet file to begin saving your data.", 
        0, 
        selectFileCallback
    );    
}

export default openConnectDialog;