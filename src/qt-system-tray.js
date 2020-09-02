const fs = require('fs');
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
import openConnectDialog from './ui/ConnectDialog';
import {walletFileSet, resetWalletFilePath} from './db/helpers';
import {getWalletBalance} from './crypto/arweave-helpers';

export const win = new QMainWindow();
console.log(path.join(
    process.cwd(), 
    `assets/images/${process.platform === 'win32' ? 'tray-logo16x16.ico' : 'tray-logo32x32.png'}`
));
const trayIcon = new QIcon(
    path.join(
        process.cwd(), 
        `assets/images/${process.platform === 'win32' ? 'tray-logo16x16.ico' : 'tray-logo32x32.png'}`
    )
);
const tray = new QSystemTrayIcon();
tray.setIcon(trayIcon);
tray.show();
tray.setToolTip("Evermore");

exports.systemTray = tray;


const createLoggedOutSystray = (menu) => {
    const connectAction = new QAction();
    connectAction.setText("Connect");
    connectAction.addEventListener("triggered", () => {
        openConnectDialog(win);
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
    getWalletBalance(wallet_path).then((balance) => {
        balanceAction.setText("Balance: " + balance + " AR");
    });
    
    balanceAction.addEventListener("triggered", () => {
        const wallet_path = walletFileSet();

        balanceAction.setText("Updating ..."); 

        getWalletBalance(wallet_path).then((balance) => {
            balanceAction.setText("Balance: " + balance + " AR");
        });
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