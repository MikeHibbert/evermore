const dialog = require('dialog-node');
const fs = require('fs');
const path = require('path');
import {
    QMainWindow,
    QWidget,
    QPushButton,
    QLineEdit,
    FlexLayout,
    QApplication,
    QFileDialog,
    QLabel,
    QPixmap, QIcon
} from "@nodegui/nodegui";
import {
    setWalletFilePath, 
    resetWalletFilePath,
    AddSyncedFolder, 
    AddPendingFile
} from '../db/helpers';
import {getOnlineVersions} from '../crypto/arweave-helpers';
import {InitFileWatcher} from '../fsHandling/Init';
import {
    getOfflineFilesAndFoldersStructure,
    compareLocalFileInfoWithOnlineFileInfo
} from '../fsHandling/helpers';
import openSyncSettingsDialog from './SyncSettingsDialog';
import {createLoggedInSystray} from '../qt-system-tray';
import {settings} from '../config';

const rootStyleSheet = `
    #rootView {
        padding: 10px;
    }

    #walletPathControls {
        flex-direction: row;    
    }  

    #walletFieldset {
    }

    #walletPathLabel {
        font-weight: bold;
        margin-bottom: 5px;
    }

    #walletPathText {
        margin-right: 5px;
    }

    #btnSelectWallet {
    }

    #syncActions {
        flex-direction: row;
        margin-top: 10px;
    }

    #syncActionsLabel {
        font-weight: bold;
        margin-top: 5px;
    }

    #syncActionsSpacer {
        flex:2;
    }

    #actions {
        flex-direction: row;
        margin-top: 30px;
    }

    #btnCreateWallet {
    }

    #buttonSpacer {
        flex:2;
    }
`;

let setupWin = null;

const OpenInitialSetupDialog = (oldSystray) => {
    setupWin = new QMainWindow();
    setupWin.setWindowTitle("Setup Evermore");
    setupWin.setWindowIcon(new QIcon(settings.NOTIFY_ICON_PATH));
    
    doSetupStageOne(oldSystray);

    setupWin.show();
    global.win = setupWin;
}

const doSetupStageOne = (oldSystray) => {
    const setupRootView = new QWidget();
    setupRootView.setObjectName("rootView");
    const setupRootViewLayout = new FlexLayout()
    setupRootView.setLayout(setupRootViewLayout);

    setupRootView.setStyleSheet(rootStyleSheet);

    const label = new QLabel();
    const image = new QPixmap();

    image.load(settings.SETUP_STAGE_1);
    label.setPixmap(image);

    setupRootView.layout.addWidget(label);

    createSetupStageOneActionsRow(setupRootView, function() {
        doSetupStageTwo(oldSystray);
    });

    setupWin.setCentralWidget(setupRootView);    
}

const createSetupStageOneActionsRow = (setupRootView, nextCallback) => {
    const actions = new QWidget();
    const actionsLayout = new FlexLayout();
    actions.setObjectName('actions');
    actions.setLayout(actionsLayout);

    const buttonSpacer = new QWidget();
    const buttonSpacerLayout = new FlexLayout();
    buttonSpacer.setObjectName('buttonSpacer');
    buttonSpacer.setLayout(buttonSpacerLayout);

    actionsLayout.addWidget(buttonSpacer);

    const btnCreateWallet = new QPushButton();
    btnCreateWallet.setText("Create My Wallet");
    btnCreateWallet.setObjectName(`btnCreateWallet`);

    btnCreateWallet.addEventListener("clicked", () => {
        openArweaveWalletPage();
    });

    actionsLayout.addWidget(btnCreateWallet);

    const btnNext = new QPushButton();
    btnNext.setText("Next");
    btnNext.setObjectName(`btnNext`);

    btnNext.addEventListener("clicked", () => {
        if(nextCallback) {
            nextCallback();
        }   
    });

    actionsLayout.addWidget(btnNext, btnNext.getFlexNode(), );

    setupRootView.layout.addWidget(actions);
}

const openArweaveWalletPage = () => {
    var url = 'https://www.arweave.org/wallet';
    var start = (process.platform == 'darwin'? 'open': process.platform == 'win32'? 'start': 'xdg-open');
    require('child_process').exec(start + ' ' + url);
}

const doSetupStageTwo = (oldSystray) => {
    const setupRootView = new QWidget();
    setupRootView.setObjectName("rootView");
    const setupRootViewLayout = new FlexLayout()
    setupRootView.setLayout(setupRootViewLayout);

    setupRootView.setStyleSheet(rootStyleSheet);

    const label = new QLabel();
    const image = new QPixmap();

    image.load(settings.SETUP_STAGE_2);
    label.setPixmap(image);

    setupRootView.layout.addWidget(label);

    createSetupStageTwoActionsRow(setupRootView, oldSystray, function() {
        setupWin.hide();

        const fileDialog = new QFileDialog();
        fileDialog.setFileMode(0);
        fileDialog.setNameFilter('Wallet File (*.json)');
        fileDialog.exec();

        const selectedFiles = fileDialog.selectedFiles(); 

        selectFileCallback(selectedFiles[0]);

        const folderDialog = new QFileDialog();
        folderDialog.setFileMode(2);
        folderDialog.exec();

        const selectedFolders = folderDialog.selectedFiles(); 

        debugger;

        selectFolderCallback(selectedFolders[0]);  
        
    });

    setupWin.setCentralWidget(setupRootView);
    
}

const createSetupStageTwoActionsRow = (setupRootView, oldSystray, nextCallback) => {
    const actions = new QWidget();
    const actionsLayout = new FlexLayout();
    actions.setObjectName('actions');
    actions.setLayout(actionsLayout);

    const buttonSpacer = new QWidget();
    const buttonSpacerLayout = new FlexLayout();
    buttonSpacer.setObjectName('buttonSpacer');
    buttonSpacer.setLayout(buttonSpacerLayout);

    actionsLayout.addWidget(buttonSpacer);

    const btnBack = new QPushButton();
    btnBack.setText("Back");
    btnBack.setObjectName(`btnBack`);

    btnBack.addEventListener("clicked", () => {
        doSetupStageOne(oldSystray);
    });

    actionsLayout.addWidget(btnBack);

    const btnConnect = new QPushButton();
    btnConnect.setText("Connect");
    btnConnect.setObjectName(`btnNext`);

    btnConnect.addEventListener("clicked", () => {
        if(nextCallback) {
            nextCallback();
        }   
    });

    actionsLayout.addWidget(btnConnect, btnConnect.getFlexNode(), );

    setupRootView.layout.addWidget(actions);
}

export const doSetupStageThree = (oldSystray) => {
    const setupRootView = new QWidget();
    setupRootView.setObjectName("rootView");
    const setupRootViewLayout = new FlexLayout()
    setupRootView.setLayout(setupRootViewLayout);

    setupRootView.setStyleSheet(rootStyleSheet);
    
    setupWin.setCentralWidget(setupRootView);

    const label = new QLabel();
    const image = new QPixmap();

    image.load(settings.SETUP_STAGE_3);
    label.setPixmap(image);

    setupRootView.layout.addWidget(label);

    createSetupStageThreeActionsRow(win, rootView, oldSystray, function() {
        setupWin.hide();
    });

    setupWin.setCentralWidget(setupRootView);
}

const createSetupStageThreeActionsRow = (win, setupRootView, oldSystray, nextCallback) => {
    const actions = new QWidget();
    const actionsLayout = new FlexLayout();
    actions.setObjectName('actions');
    actions.setLayout(actionsLayout);

    const buttonSpacer = new QWidget();
    const buttonSpacerLayout = new FlexLayout();
    buttonSpacer.setObjectName('buttonSpacer');
    buttonSpacer.setLayout(buttonSpacerLayout);

    actionsLayout.addWidget(buttonSpacer);

    const btnBack = new QPushButton();
    btnBack.setText("Back");
    btnBack.setObjectName(`btnBack`);

    btnBack.addEventListener("clicked", () => {
        const setupRootView = new QWidget();
        setupRootView.setObjectName("rootView");
        const setupRootViewLayout = new FlexLayout()
        setupRootView.setLayout(setupRootViewLayout);

        setupRootView.setStyleSheet(rootStyleSheet);

        doSetupStageOne(win, setupRootView, oldSystray);

        win.setCentralWidget(setupRootView);
    });

    actionsLayout.addWidget(btnBack);

    const btnConnect = new QPushButton();
    btnConnect.setText("Connect");
    btnConnect.setObjectName(`btnNext`);

    btnConnect.addEventListener("clicked", () => {
        if(nextCallback) {
            nextCallback();
        }   
    });

    actionsLayout.addWidget(btnConnect, btnConnect.getFlexNode(), );

    setupRootView.layout.addWidget(actions);
}

export const selectFolderCallback = (retVal) => {

    if(retVal.length == 0) {
        setupWin.show();
        resetWalletFilePath();
        doSetupStageTwo(null);
    }

    AddSyncedFolder(retVal.replace('\r\n', ''));

    createDefaultEvermoreFolders(retVal.replace('\r\n', ''));

    const path_infos = getOfflineFilesAndFoldersStructure((path_infos) => {
        if(path_infos[''].children.length > 0) {
            openSyncSettingsDialog(path_infos[''], (pis) => {
                configureWithPathsFromInfo(pis)
            },
            (pis) => {
                configureWithPathsFromInfo(pis)
            });
        }        
    });

    InitFileWatcher(retVal.replace('\r\n', ''));

    createLoggedInSystray();
}

const createDefaultEvermoreFolders = (sync_folder) => {
    const photos_exist = fs.existsSync(path.join(sync_folder, 'Photos'));
    if(!photos_exist) {
        fs.mkdirSync(path.join(sync_folder, 'Photos'));
    }

    const public_exist = fs.existsSync(path.join(sync_folder, 'Public'));
    if(!public_exist) {
        fs.mkdirSync(path.join(sync_folder, 'Public'));
    }
}

export const selectFileCallback = (retVal) => {   
    if(retVal.length == 0) {
        setupWin.show();
        doSetupStageTwo(null);
    }

    const path = retVal.replace('\r\n', '');

    setWalletFilePath(path);
}

export const configureWithPathsFromInfo = (path_info) => {
    path_info.children.forEach(async pi => {
        if(pi.type == 'folder') {
            configureWithPathsFromInfo(pi);
        } else {
            if(pi.checked) {
                const online_versions = await getOnlineVersions(pi);

                debugger;
                if(online_versions.length == 0) {
                    AddPendingFile(null, pi.path, 1);
                } else {
                    online_versions.sort((a, b) => a.modified - b.modified);

                    const online_version = online_versions[online_versions.length - 1];

                    compareLocalFileInfoWithOnlineFileInfo(pi, online_version);
                }
            }            
        }
    })
}

export default OpenInitialSetupDialog;