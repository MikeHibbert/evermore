const notifier = require('node-notifier');
import {
    QPushButton,
    QFileDialog,
    QWidget,
    QLineEdit,
    QLineEditSignals,
    FlexLayout,
    QLabel,
    FileMode
  } from "@nodegui/nodegui";

import {
  walletFileSet, 
  setWalletFilePath, 
  UpdateExclusions, 
  GetExclusions,
  GetSyncFrequency,
  SetSyncFrequency
} from '../db/helpers';
import {getWalletAddress} from '../crypto/arweave-helpers';
import openConnectDialog from './ConnectDialog';
import { settings } from "../config";
import { 
  getOnlineFilesAndFoldersStructure,
  getOfflineFilesAndFoldersStructure, 
  mergePathInfos,
  removePathInfosWithChecked,
  unregisterPathFolders
} from "../fsHandling/helpers";
import {sendMessage} from '../integration/server';
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

  #syncFrequency {
    flex-direction: row;
    margin-top: 10px;
  }

  #syncFrequencyLabel {
    font-weight: bold;
    margin-top: 5px;
  }

  #syncFrequencyLineEdit {
    width: 30px;
  }

  #syncFrequencySpacer {
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
        wallet_path_changed: false,
        wallet_path: wallet_path,
        sync_frequency_changed: false,
        sync_frequency: GetSyncFrequency().toString(),
        file_exclusions_changed: false,
        file_exclusions: []
      }

      // wallet file path
      createWalletPathRow(editable_settings, rootView);

      createSyncRow(editable_settings, rootView, win);

      createSyncFrequencyRow(editable_settings, rootView, win);
      
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
        editable_settings.wallet_file_changed = true;
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

      const exclusions = GetExclusions();

      const online_path_infos = await getOnlineFilesAndFoldersStructure(wallet_address);

      const exclusions_and_online_path_infos = mergePathInfos(online_path_infos[''], exclusions[''], true);
      
      getOfflineFilesAndFoldersStructure((offline_path_infos) => {
        const path_infos = mergePathInfos(offline_path_infos[''], exclusions_and_online_path_infos[''], true);

        if(path_infos[''].children.length == 0) {
          notifier.notify({
            title: 'Evermore Datastore',
            icon: settings.NOTIFY_ICON_PATH,
            message: "There are currently no files to download/sync online"
          });

          return;
        }
        
        openSyncSettingsDialog(path_infos[''], (edited_path_infos) => {
          const exclusions = removePathInfosWithChecked(edited_path_infos, false);
          const sync_folder = GetSyncedFolders()[0];

          UpdateExclusions(exclusions);

          unregisterPathFolders(exclusions[''], sendMessage);
        });
      });  
    } 
  });

  syncActionsLayout.addWidget(btnSelectiveSync);

  rootView.layout.addWidget(syncActions);
}

const createSyncFrequencyRow = async (editable_settings, rootView, win) => { 
  // label
  const syncFrequencyLabel = new QLabel();
  syncFrequencyLabel.setObjectName("syncFrequencyLabel");
  syncFrequencyLabel.setText("Sync Frequency:");

  rootView.layout.addWidget(syncFrequencyLabel);

  const syncFrequency = new QWidget();
  const syncFrequencyLayout = new FlexLayout();
  syncFrequency.setObjectName('syncFrequency');
  syncFrequency.setLayout(syncFrequencyLayout);

  const syncFrequencySpacer = new QWidget();
  const syncFrequencySpacerLayout = new FlexLayout();
  syncFrequencySpacer.setObjectName('syncFrequencySpacer');
  syncFrequencySpacer.setLayout(syncFrequencySpacerLayout);

  syncFrequencyLayout.addWidget(syncFrequencySpacer);

  

  // label
  const syncFrequencyLineEditLabel = new QLabel();
  syncFrequencyLineEditLabel.setObjectName("syncFrequencyLineEditLabel");
  syncFrequencyLineEditLabel.setText("Sync files every:");
  syncFrequencyLayout.addWidget(syncFrequencyLineEditLabel);

  const syncFrequencyLineEdit = new QLineEdit();
  syncFrequencyLineEdit.setObjectName("syncFrequencyLineEdit");
  syncFrequencyLineEdit.setText(editable_settings.sync_frequency);
  syncFrequencyLineEdit.addEventListener('textChanged', (changed) => {
    editable_settings.sync_frequency = changed;
    editable_settings.sync_frequency_changed = true;
  })

  syncFrequencyLayout.addWidget(syncFrequencyLineEdit);

  const syncFrequencyMinutesLabel = new QLabel();
  syncFrequencyMinutesLabel.setObjectName("syncFrequencyMinutesLabel");
  syncFrequencyMinutesLabel.setText(" minutes");
  syncFrequencyLayout.addWidget(syncFrequencyMinutesLabel);
    
  rootView.layout.addWidget(syncFrequency);
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
      if(editable_settings.wallet_file_changed) {
        setWalletFilePath(editable_settings.wallet_file);
      }
      if(editable_settings.sync_frequency_changed) {
        const sync_frequency = parseInt(editable_settings.sync_frequency, 10);

        debugger;

        if(sync_frequency != NaN) {
          SetSyncFrequency(sync_frequency);
        }        
      }
      if(editable_settings.file_exclusions_changed) {
        editable_settings.file_exclusions.forEach(file_info => {
          UpdateExclusions(file_info);
        });
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