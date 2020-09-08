import {
    QPushButton,
    QFileDialog,
    QWidget,
    FlexLayout,
    QLabel,
    FileMode
  } from "@nodegui/nodegui";

import {walletFileSet, setWalletFilePath} from '../db/helpers';
import {getWalletAddress} from '../crypto/arweave-helpers';
import openConnectDialog from './ConnectDialog';
import { settings } from "../config";
import { getFiles } from "../fsHandling/helpers";
import openSyncSettingsDialog from './SyncSettingsDialog';

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

  #btnSave {
  }

  #buttonSpacer {
    flex:2;
  }
`;

const openSettingsDialog = () => {
    const wallet_path = walletFileSet();

    if(!wallet_path) {
      openConnectDialog();
    } else {
      
      const rootView = new QWidget();
      rootView.setObjectName("rootView");
      const rootViewLayout = new FlexLayout()
      rootView.setLayout(rootViewLayout);
      
      const editable_settings = {
        changed: false,
        wallet_path: wallet_path
      }
      // wallet file path
      createWalletPathRow(editable_settings, rootView);

      createSyncRow(editable_settings, rootView, win);
      
      createActionsRow(editable_settings, rootView, win);

      rootView.setStyleSheet(rootStyleSheet);

      win.setCentralWidget(rootView);
      win.setWindowTitle("Evermore Settings");
      // win.resize(800, 640);
      win.show();
    }

    
}

const createWalletPathRow = (editable_settings, rootView) => {

  // Fieldset
  const walletFieldset = new QWidget();
  const walletFieldsetLayout = new FlexLayout();
  walletFieldset.setObjectName('walletFieldset');
  walletFieldset.setLayout(walletFieldsetLayout);

  // label
  const walletPathLabel = new QLabel();
  walletPathLabel.setObjectName("walletPathLabel");
  walletPathLabel.setText("Wallet Location:");
  walletFieldsetLayout.addWidget(walletPathLabel);
  

  // path and select button
  const walletPathControls = new QWidget();
  const walletPathControlsLayout = new FlexLayout();
  walletPathControls.setObjectName('walletPathControls');
  walletPathControls.setLayout(walletPathControlsLayout);

  const walletPathText = new QLabel();
  walletPathText.setObjectName("walletPathText");
  const wallet_path_parts = editable_settings.wallet_path.split(settings.PLATFORM == "win32" ? '\\':'/');

  walletPathText.setText(wallet_path_parts[wallet_path_parts.length - 1]);
  walletPathControlsLayout.addWidget(walletPathText);
  
  const btnSelectWallet = new QPushButton();
  btnSelectWallet.setText("Select Wallet");
  btnSelectWallet.setObjectName(`btnSelectWallet`);

  btnSelectWallet.addEventListener("clicked", () => {
      const fileDialog = new QFileDialog()
      fileDialog.setFileMode(FileMode.AnyFile);
      fileDialog.setNameFilter('AR Wallet (*.json)');
      fileDialog.exec();

      const selected_file = fileDialog.selectedFiles();

      if(selected_file.length > 0) {
        editable_settings.wallet_file = selected_file[0];
        editable_settings.changed = true;
        const wallet_path_parts = editable_settings.wallet_path.split(settings.PLATFORM == "win32" ? '\\':'/');
        walletPathText.setText(wallet_path_parts[wallet_path_parts.length - 1]);
      }        
  });
  walletPathControlsLayout.addWidget(btnSelectWallet);

  walletFieldsetLayout.addWidget(walletPathControls);    

  rootView.layout.addWidget(walletFieldset);
}

const createSyncRow = async (editable_settings, rootView, win) => { 
  // label
  const syncActionsLabel = new QLabel();
  syncActionsLabel.setObjectName("syncActionsLabel");
  syncActionsLabel.setText("File Sync Options:");

  rootView.layout.addWidget(syncActionsLabel);

  const syncActions = new QWidget();
  const syncActionsLayout = new FlexLayout();
  syncActions.setObjectName('syncActions');
  syncActions.setLayout(syncActionsLayout);

  const syncActionsSpacer = new QWidget();
  const syncActionsSpacerLayout = new FlexLayout();
  syncActionsSpacer.setObjectName('syncActionsSpacer');
  syncActionsSpacer.setLayout(syncActionsSpacerLayout);

  syncActionsLayout.addWidget(syncActionsSpacer);

  const btnSelectiveSync = new QPushButton();
  btnSelectiveSync.setText("Selective File Sync Settings");
  btnSelectiveSync.setObjectName(`btnSelectiveSync`);

  btnSelectiveSync.addEventListener("clicked", async () => {
    
    const wallet_file = walletFileSet();

    if(wallet_file) {
      const wallet_address = await getWalletAddress(wallet_file);

      const folders = await getFiles(wallet_address);

      openSyncSettingsDialog(folders);
    } 
  });

  syncActionsLayout.addWidget(btnSelectiveSync);

  rootView.layout.addWidget(syncActions);
}



const createActionsRow = (editable_settings, rootView, win) => {
  const actions = new QWidget();
  const actionsLayout = new FlexLayout();
  actions.setObjectName('actions');
  actions.setLayout(actionsLayout);

  const buttonSpacer = new QWidget();
  const buttonSpacerLayout = new FlexLayout();
  buttonSpacer.setObjectName('buttonSpacer');
  buttonSpacer.setLayout(buttonSpacerLayout);

  actionsLayout.addWidget(buttonSpacer);

  const btnSave = new QPushButton();
  btnSave.setText("Save");
  btnSave.setObjectName(`btnSave`);

  btnSave.addEventListener("clicked", () => {
      if(editable_settings.changed) {
        setWalletFilePath(editable_settings.wallet_file);
      }  

      win.hide();  
  });

  actionsLayout.addWidget(btnSave);

  const btnCancel = new QPushButton();
  btnCancel.setText("Cancel");
  btnCancel.setObjectName(`btnCancel`);

  btnCancel.addEventListener("clicked", () => {
      win.hide();      
  });

  actionsLayout.addWidget(btnCancel, btnCancel.getFlexNode(), );

  rootView.layout.addWidget(actions);
}

export default openSettingsDialog;