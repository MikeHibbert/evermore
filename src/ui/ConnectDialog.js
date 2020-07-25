const dialog = require('dialog-node');
import SysTray from 'systray';
import Logo from '../logo';
import {getWalletBalance} from '../crypto/arweave-helpers';
import {setWalletFilePath} from '../db/helpers';
import {setSystrayInstance, ConnectedActions} from '../system-tray';

const openConnectDialog = (systray, action) => {
    console.log("openConnectDialog Dialog Opened")

    var callback = function(code, retVal, stderr)
    {                        
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

            systray.kill(false);

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
                ConnectedActions(action);
            })

            setSystrayInstance(new_systray);
        });

        console.log("return value = <" + path + ">");
    }

    
    dialog.fileselect(
        "Please select a wallet file to begin saving your data.",
        "Please select a wallet file to begin saving your data.", 
        0, 
        callback
    );
}

export default openConnectDialog;