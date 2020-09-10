const dialog = require('dialog-node');
import {createLoggedInSystray} from '../qt-system-tray';
import {InitFileWatcher} from '../fsHandling/Init';
import {getSyncPathInfos} from '../fsHandling/helpers';
import {getWalletBalance} from '../crypto/arweave-helpers';
import {setWalletFilePath, AddSyncedFolder} from '../db/helpers';
import openSyncSettingsDialog from './SyncSettingsDialog';

let systray = null;
const selectFolderCallback = (code, retVal, stderr) => {
    console.log(retVal);
    if(retVal.length == 0) return;

    AddSyncedFolder(retVal.replace('\r\n', ''));

    const path_infos = getSyncPathInfos();

    openSyncSettingsDialog(path_infos, (path_infos) => {

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