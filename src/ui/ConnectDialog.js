const dialog = require('dialog-node');
import SysTray from 'systray';
import { InitFileWatcher } from '../fsHandling/Init';
import {getWalletBalance} from '../crypto/arweave-helpers';
import {setWalletFilePath, AddSyncedFolder} from '../db/helpers';
//import {setSystrayInstance, ConnectedActions} from '../system-tray';


let systray = null;
const selectFolderCallback = (code, retVal, stderr) => {
    console.log(retVal);
    if(retVal.length == 0) return;

    AddSyncedFolder(retVal.replace('\r\n', ''));
    InitFileWatcher(retVal.replace('\r\n', ''));
}

var selectFileCallback = (code, retVal, stderr) => {
    if(retVal.length == 0) return;

    const path = retVal.replace('\r\n', '');

    setWalletFilePath(path);

    getWalletBalance(path).then((balance) => {
        const menu_items = [
            {
                title: "Balance: " + balance + " AR",
                tooltip: "Wallet balance",
                // checked is implement by plain text in linux
                checked: false,
                enabled: true
            },{
                title: "Settings",
                tooltip: "Open Settings",
                // checked is implement by plain text in linux
                checked: false,
                enabled: true
            },
            {
                title: "Shutdown Evermore Datastore",
                tooltip: "Shutdown Evermore Datastore",
                checked: false,
                enabled: true
            }
        ];

        systray.kill(false); // kill the tray but not the app

        const new_systray = new SysTray({
            menu: {
                // you should using .png icon in macOS/Linux, but .ico format in windows
                icon: Logo.toString('base64'),
                title: "Evermore Datastore",
                tooltip: "Evermore Datastore",
                items: menu_items
            },
            debug: false,
            copyDir: true, // copy go tray binary to outside directory, useful for packing tool like pkg.
        })

        new_systray.onClick(action => {
            // ConnectedActions(action);
        })

        // setSystrayInstance(new_systray);

        dialog.folderselect(
            "Please select the folder you would like to backup",
            "Please select the folder you would like to backup", 
            0, 
            selectFolderCallback
        );
    });

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