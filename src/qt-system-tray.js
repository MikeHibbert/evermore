const fs = require('fs');
const notifier = require('node-notifier');
import {
    QKeySequence,
    QApplication,
    QMainWindow,
    QMenu,
    QIcon,
    QSystemTrayIcon,
    QAction
} from "@nodegui/nodegui";
import path from "path";
import openSettingsDialog from "./ui/SettingsDialog";
import OpenInitialSetupDialog from './ui/InitialSetupDialog';
import {walletFileSet, resetWalletFilePath, GetSyncStatus, SetSyncStatus} from './db/helpers';
import {getWalletBalance} from './crypto/arweave-helpers';
import {settings} from './config';

export const win = new QMainWindow();
win.setWindowTitle("Evermore Settings");
win.setWindowIcon(new QIcon(settings.NOTIFY_ICON_PATH));

let trayIcon = null;

if(process.platform == 'win32') {
    trayIcon = new QIcon(
        path.resolve(__dirname, '../assets/images/tray-logo32x32.png')
    );
}
if(process.platform == 'darwin') {
    const icon_path = path.join(
        process.cwd(), 
        'assets/images/tray-logo32x32.png'
    );
    trayIcon = new QIcon(
        icon_path
    );
}


const tray = new QSystemTrayIcon();
tray.setIcon(trayIcon);
tray.show();
tray.setToolTip("Evermore");

exports.systemTray = tray;


const createLoggedOutSystray = (menu) => {
    const connectAction = new QAction();
    connectAction.setText("Setup");
    connectAction.addEventListener("triggered", () => {
        OpenInitialSetupDialog(tray);
    });

    const openWebclientSite = new QAction();
    openWebclientSite.setText("Open Evemore Online");
    openWebclientSite.addEventListener("triggered", () => {
        openWebclient();
    });

    // ----------------------
    // Add everything to menu
    // ----------------------
    
    menu.addAction(connectAction);
    menu.addAction(openWebclientSite);

    // -------------------
    // Quit Action
    // -------------------
    const shutdownAction = new QAction();
    shutdownAction.setText("Shutdown Evermore");
    shutdownAction.setIcon(trayIcon);
    shutdownAction.addEventListener("triggered", () => {
    const app = QApplication.instance();
        app.exit(0);
    });

    menu.addAction(shutdownAction);
}

export const createLoggedInSystray = (menu) => {

    if(typeof menu == "undefined") {
        menu = new QMenu();
        tray.setContextMenu(menu);
    }
    
    const balanceAction = new QAction();

    const wallet_path = walletFileSet();
    try {
        getWalletBalance(wallet_path).then((balance) => {
            balanceAction.setText("Balance: " + balance + " AR");
        });
    } catch(e) {
        balanceAction.setText("Balance unavailable.");
    }
    
    
    balanceAction.addEventListener("triggered", () => {
        const wallet_path = walletFileSet();

        balanceAction.setText("Updating ..."); 

        getWalletBalance(wallet_path).then((balance) => {
            balanceAction.setText("Balance: " + balance + " AR");
        });
    });

    const syncStatus = new QAction();
    const paused = GetSyncStatus();
    const sync_status = paused == true ? "Syncing Active" : "Syncing Deactivated";
    syncStatus.setText(sync_status);
    syncStatus.setCheckable(true);
    syncStatus.setChecked(paused);
    syncStatus.addEventListener("triggered", () => {
        const syncing = GetSyncStatus();

        SetSyncStatus(!syncing);

        const sync_status = syncing == true ? "Syncing active" : "Syncing paused";
        syncStatus.setText(sync_status);
        syncStatus.setChecked(syncing);

        if(syncing) {
            notifier.notify({
                title: 'Evermore Datastore',
                icon: settings.NOTIFY_ICON_PATH,
                message: 'Syncing has been paused',
                timeout: 2
            });
        } else {
            notifier.notify({
                title: 'Evermore Datastore',
                icon: settings.NOTIFY_ICON_PATH,
                message: 'Syncing has resumed',
                timeout: 2
            });
        }
    });

    const showSettings = new QAction();
    showSettings.setText("Settings");
    showSettings.addEventListener("triggered", () => {
        openSettingsDialog(win);
    });

    const openWebclientSite = new QAction();
    openWebclientSite.setText("Open Evemore Online");
    openWebclientSite.addEventListener("triggered", () => {
        openWebclient();
    });

    // ----------------------
    // Add everything to menu
    // ----------------------
    menu.addAction(balanceAction);
    menu.addAction(syncStatus);
    menu.addAction(showSettings);
    menu.addAction(openWebclientSite);

    // -------------------
    // Quit Action
    // -------------------
    const shutdownAction = new QAction();
    shutdownAction.setText("Shutdown Evermore");
    shutdownAction.setIcon(trayIcon);
    shutdownAction.addEventListener("triggered", () => {
    const app = QApplication.instance();
        app.exit(0);
    });

    menu.addAction(shutdownAction);
}

const initSystemTray = () => {
    
    const menu = new QMenu();
    tray.setContextMenu(menu);

    const wallet_path = walletFileSet();

    if(wallet_path.length == 0) {
        createLoggedOutSystray(menu);
    } else {
        fs.access(wallet_path, fs.F_OK, (err) => {
            if (err) {
              resetWalletFilePath();
              createLoggedOutSystray(menu);
              return
            }
          
            createLoggedInSystray(menu);
        });
    }
    

    

    const qApp = QApplication.instance();
    qApp.setQuitOnLastWindowClosed(false); // required so that app doesnt close if we close all windows.

    global.win = win; // To prevent win from being garbage collected.
    global.systemTray = tray; // To prevent system tray from being garbage collected.
}

export default initSystemTray;

export const openWebclient = () => {
    var url = 'https://evermoredata.store/';
    var start = (process.platform == 'darwin'? 'open': process.platform == 'win32'? 'start': 'xdg-open');
    require('child_process').exec(start + ' ' + url);
}