const fs = require('fs');
import SysTray from 'systray'
import Logo from './logo';
import {walletFileSet, resetWalletFilePath} from './db/helpers';
import {getWalletBalance} from './crypto/arweave-helpers';
import openSettingsDialog from './ui/SettingsDialog';
import openConnectDialog from './ui/ConnectDialog';

export let systray = null;

export const setSystrayInstance = (st) => {
    systray = st;
}

const createLoggedOutSystray = () => {
    const menu_items = [];
    
    menu_items.push({
        title: "Connect",
        tooltip: "Connect your AR wallet to begin storing data.",
        // checked is implement by plain text in linux
        checked: false,
        enabled: true
    },
    {
        title: "Shutdown Evermore Datastore",
        tooltip: "Shutdown Evermore Datastore",
        checked: false,
        enabled: true
    });

    systray = new SysTray({
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

    systray.onClick(action => {
        DisconnectedActions(action);
    })
}

const initSystemTray = () => {

    const menu_items = [];
    const wallet_path = walletFileSet();

    if(wallet_path.length == 0) {
        createLoggedOutSystray();
    } else {
        fs.access(wallet_path, fs.F_OK, (err) => {
            if (err) {
              resetWalletFilePath();
              createLoggedOutSystray();
              return
            }
          
            getWalletBalance(wallet_path).then((balance) => {
                menu_items.push({
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
                });
    
                systray = new SysTray({
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
    
                systray.onClick(action => {
                    ConnectedActions(action);
                })
            });
        });
    }

    return systray;
}

export const ConnectedActions = (action) => {
    if (action.seq_id === 0) {
        getWalletBalance(wallet_path).then((balance) => {
            systray.sendAction({
                type: 'update-item',
                item: {
                    ...action.item,
                    title: "Balance: " + balance + " AR",
                },
                seq_id: action.seq_id,
            })
        });
    } else if (action.seq_id === 1) {
        openSettingsDialog();
    } else if (action.seq_id === 2) {
        systray.kill();
    }
}

export const DisconnectedActions = (action) => {
    if (action.seq_id === 0) {
        openConnectDialog(systray, action);
    } else if (action.seq_id === 1) {
        systray.kill()
    }
}


export default initSystemTray;