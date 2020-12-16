const fs = require('fs');
import {showNotification} from './ui/notifications';
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
import {walletFileSet, resetWalletFilePath, GetSyncStatus, SetSyncStatus, GetPendingFile, GetAllPendingFiles, GetAllProposedFiles, GetDownloads} from './db/helpers';
import {getWalletBalance} from './crypto/arweave-helpers';
import {settings} from './config';
import {reviewSyncableFiles} from './fsHandling/Init';

export const win = new QMainWindow();
win.setWindowTitle("Evermore Settings");
win.setWindowIcon(new QIcon(settings.NOTIFY_ICON_PATH));

// let trayIcon = null;
const trayIcon = new QIcon(
    path.resolve(__dirname, '../assets/images/tray-logo32x32.png')
);

// if(process.platform == 'win32') {
//     trayIcon = new QIcon(
//         path.resolve(__dirname, '../assets/images/tray-logo32x32.png')
//     );
// }

// if(process.platform == 'darwin') {
//     trayIcon = new QIcon(
//         path.resolve(__dirname, '../assets/images/tray-logo32x32.png')
//     );
// }

// if(process.platform == 'linux') {
//     trayIcon = new QIcon(
//         path.resolve(__dirname, '../assets/images/tray-logo32x32.png')
//     );
// }


let tray = null;

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

let reviewPendingStatusAction = null;
let reviewProposedStatusAction = null;
let reviewDownloadStatusAction = null;

export const setReviewStatusText = (status_text) => {
    reviewPendingStatusAction.setText(status_text);
}

export const updateFileMonitoringStatuses = () => {
    const proposed_files = GetAllProposedFiles();
    if(proposed_files.length > 0) {
        reviewProposedStatusAction.setText(`${proposed_files.length} files to review`);
    } else {
        reviewProposedStatusAction.setText(`0 files to review`);
    }

    const pending_files = GetAllPendingFiles();
    if(pending_files.length > 0) {
        reviewPendingStatusAction.setText(`${pending_files.length} files to upload`);
    } else {
        reviewPendingStatusAction.setText(`0 files to upload`);
    }

    const download_files = GetDownloads();
    if(download_files.length > 0) {
        reviewDownloadStatusAction.setText(`${download_files.length} files to download`);
    } else {
        reviewDownloadStatusAction.setText(`0 files to download`);
    }
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

    reviewProposedStatusAction = new QAction();
    const proposed_files = GetAllProposedFiles();
    if(proposed_files.length > 0) {
        reviewProposedStatusAction.setText(`${proposed_files.length} files to review`);
    } else {
        reviewProposedStatusAction.setText(`0 files to review`);
    }

    reviewPendingStatusAction = new QAction();
    const pending_files = GetAllPendingFiles();
    if(pending_files.length > 0) {
        reviewPendingStatusAction.setText(`${pending_files.length} files to upload`);
    } else {
        reviewPendingStatusAction.setText(`0 files to upload`);
    }

    reviewDownloadStatusAction = new QAction();
    const download_files = GetDownloads();
    if(download_files.length > 0) {
        reviewDownloadStatusAction.setText(`${download_files.length} files to download`);
    } else {
        reviewDownloadStatusAction.setText(`0 files to download`);
    }

    const reviewAction = new QAction();
    reviewAction.setText('Click to review file changes');
    reviewAction.addEventListener('triggered', () => {
        reviewSyncableFiles();
    });

    const syncStatus = new QAction();
    const paused = GetSyncStatus();
    const sync_status = paused == true ? "Syncing active" : "Syncing paused";
    syncStatus.setText(sync_status);
    syncStatus.setCheckable(true);
    syncStatus.setChecked(paused);
    syncStatus.addEventListener("triggered", () => {
        const syncing = GetSyncStatus();

        SetSyncStatus(!syncing);

        const sync_status = !syncing == true ? "Syncing active" : "Syncing paused";
        syncStatus.setText(sync_status);
        syncStatus.setChecked(!syncing);

        if(syncing) {
            showNotification('Syncing has been paused');
        } else {
            showNotification('Syncing has resumed');
        }
    });

    const showSettings = new QAction();
    showSettings.setText("Settings");
    showSettings.addEventListener("triggered", () => {
        openSettingsDialog(win);
    });

    const openWebclientSite = new QAction();
    openWebclientSite.setText("Open Evemore Webclient");
    openWebclientSite.addEventListener("triggered", () => {
        openWebclient();
    });

    // ----------------------
    // Add everything to menu
    // ----------------------
    menu.addAction(balanceAction);
    menu.addAction(reviewProposedStatusAction);
    menu.addAction(reviewPendingStatusAction);    
    menu.addAction(reviewDownloadStatusAction);
    menu.addAction(reviewAction);
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
    tray = new QSystemTrayIcon();
    tray.setIcon(trayIcon);
    tray.show();
    tray.setToolTip("Evermore");

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