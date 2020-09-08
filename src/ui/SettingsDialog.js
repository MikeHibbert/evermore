import {
    QMainWindow,
    QPushButton,
    QPushButtonSignals,
    QAbstractButtonSignals,
    QFileDialog,
    QTextEdit,
    QWidget,
    QKeyEvent,
    FlexLayout,
    QBoxLayout,
    QLabel,
    QTreeWidgetItem, 
    QTreeWidget,
    QIcon,
    ItemDataRole,
    QPixmap,
    BaseWidgetEvents,
    NativeElement,
    FileMode,
    CheckState,
  } from "@nodegui/nodegui";

import path from "path";
import {walletFileSet, setWalletFilePath} from '../db/helpers';
import {getWalletAddress} from '../crypto/arweave-helpers';
import openConnectDialog from './ConnectDialog';
import { settings } from "../config";
import { getFiles } from "../fsHandling/helpers";

const folder_icon_path = path.join(
  process.cwd(), 
  `assets/images/${process.platform === 'win32' ? 'folder_icon.png' : 'folder_icon.png'}`
);

const file_icon_file = path.join(
  process.cwd(), 
  `assets/images/${process.platform === 'win32' ? 'folder.png' : 'folder.png'}`
);

const USER_DATA_ROLE = 20;

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
    console.log("btnSelectiveSync clicked"); 

    const wallet_file = walletFileSet();

    if(wallet_file) {
      const wallet_address = await getWalletAddress(wallet_file);

      const folders = await getFiles(wallet_address);

      const syncWin = new QMainWindow();
      const syncRootView = new QWidget();
      syncRootView.setObjectName("rootView");
      const syncRootViewLayout = new FlexLayout()
      syncRootView.setLayout(syncRootViewLayout);

      
      const tree = new QTreeWidget();

      createFolderItems(folders[''], tree, win, true, null);

      tree.addEventListener("itemChanged", (item, column) => {
        const serialised_path_info = JSON.parse(item.data(0, USER_DATA_ROLE).toString());

        const path_info = getOriginalPathInfoInstance(serialised_path_info, folders['']);

        const checked = item.data(0, ItemDataRole.CheckStateRole).toInt();

        path_info.checked = checked == CheckState.Checked ? true : false;

        if(path_info.type == "folder") {
          toggleAllChilderen(path_info);
        }
      });

      syncRootViewLayout.addWidget(tree);

      createSyncActionsRow(folders, syncRootView, rootView, syncWin);

      syncWin.setCentralWidget(syncRootView);         
      syncWin.show();
    } 
  });

  syncActionsLayout.addWidget(btnSelectiveSync);

  rootView.layout.addWidget(syncActions);
}

const getOriginalPathInfoInstance = (path_info, path_infos) => {
  if(path_info.path == path_infos.path && path_info.name == path_infos.name) {
    return path_infos;
  }

  for(let i in path_infos.childeren) {
    const pi = path_infos.childeren[i];

    if(pi.path == path_info.path && pi.name == path_info.name) {
      return pi;
    }

    if(pi.type == "folder") {
      return getOriginalPathInfoInstance(path_info, pi);
    }
  }
}

const toggleAllChilderen = (path_info) => {
  for(let i in path_info.childeren) {
    const pi = path_info.childeren[i];

    const checked = path_info.checked == true ? CheckState.Checked : CheckState.Unchecked;
    pi.control.setCheckState(0, checked);
  }
}

const createSyncActionsRow = (folders, syncRootView, rootView, win) => {
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
    console.log("btnSave clicked");

    // update original_folder_state with state from folders

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

  syncRootView.layout.addWidget(actions);
}

const createFolderItems = (path_info, tree, window, root, parent) => {
  if(!parent && !root) {
    parent = new QTreeWidgetItem();
    parent.setText(0, path_info.name);
  }

  for(let i in path_info.childeren) {
    const path = path_info.childeren[i];
    if(path.type == "folder") {
      let folder_item = null;
      if(root) {
        folder_item = createFolderItems(path, tree, window, false, null);
        tree.addTopLevelItem(folder_item);
      } else {
        folder_item = createFolderItems(path, tree, window, false, parent);
      }
      folder_item.setText(0, path.name);
      folder_item.setIcon(0, new QIcon(folder_icon_path));

      let checked = CheckState.Unchecked;

      if(path.checked) {
        checked = CheckState.Checked;
      }

      folder_item.setData(0, USER_DATA_ROLE, JSON.stringify(path));
      folder_item.setCheckState(0, checked);
      path['control'] = folder_item;

    } else {
      let file_item = null;
      if(root) {
        file_item = new QTreeWidgetItem();
        tree.addTopLevelItem(file_item);
      } else {
        file_item = new QTreeWidgetItem(parent);
      }

      file_item.setText(0, path.name);

      let checked = CheckState.Unchecked;
      if(path.checked) {
        checked = CheckState.Checked;
      }
      
      file_item.setData(0, USER_DATA_ROLE, JSON.stringify(path));
      file_item.setCheckState(0, checked);
      path['control'] = file_item;
    }
  }

  return parent;
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