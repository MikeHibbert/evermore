const dialog = require('dialog-node');
const path = require('path');
import {createLoggedInSystray} from '../qt-system-tray';
import {InitFileWatcher} from '../fsHandling/Init';
import {getOfflineFilesAndFoldersStructure} from '../fsHandling/helpers';
import {getWalletBalance} from '../crypto/arweave-helpers';
import {
    setWalletFilePath, 
    AddSyncedFolder, 
    AddPendingFile,
    ConfirmSyncedFileFromTransaction
} from '../db/helpers';
import openSyncSettingsDialog from './SyncSettingsDialog';

let systray = null;





const openConnectDialog = (oldSystray, action) => {
    systray = oldSystray;

    dialog.fileselect(
        "Please select a wallet file to begin saving your data.",
        "Please select a wallet file to begin saving your data.", 
        0, 
        action
    );    
}

export default openConnectDialog;