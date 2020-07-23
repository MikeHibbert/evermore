import SysTray from 'systray'
import Logo from './logo';
import {walletFileSet} from './db/helpers';
import {getWalletBalance} from './crypto/arweave-helpers';
import openSettingsDialog from './ui/SettingsDialog';
import openConnectDialog from './ui/ConnectDialog';

let systray = null;

const initSystemTray = () => {

    const menu_items = [];
    const wallet_path = walletFileSet();

    if(wallet_path.length == 0) {
        menu_items.push({
            title: "Connect",
            tooltip: "Connect your AR wallet to begin storing data.",
            // checked is implement by plain text in linux
            checked: false,
            enabled: true
        });
    } else {
        getWalletBalance().then((balance) => {

        });

        menu_items.push({
            title: "Fetching account balance ...",
            tooltip: "Fetching account balance ...",
            // checked is implement by plain text in linux
            checked: false,
            enabled: true
        },{
            title: "Settings",
            tooltip: "Open Settings",
            // checked is implement by plain text in linux
            checked: false,
            enabled: true
        });
    }

    menu_items.push(
         {
            title: "Shutdown Evermore Datastore",
            tooltip: "Shutdown Evermore Datastore",
            checked: false,
            enabled: true
        }
    )

    debugger;

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

    let systrayActions = DisconnectedActions;

    if(wallet_path) {
        systrayActions = ConnectedActions;
    }
    
    systray.onClick(action => {
        systrayActions(action);
    })

    return systray;
}

const ConnectedActions = (action) => {
    if (action.seq_id === 0) {
        console.log("Balance clicked")
    } else if (action.seq_id === 1) {
        openSettingsDialog();
    } else if (action.seq_id === 2) {
        systray.kill();
    }
}

const DisconnectedActions = (action) => {
    if (action.seq_id === 0) {
        openConnectDialog();
    } else if (action.seq_id === 1) {
        systray.kill()
    }
}


export default initSystemTray;