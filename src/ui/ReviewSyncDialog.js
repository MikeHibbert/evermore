import {
    QMainWindow,
    QPushButton,
    QWidget,
    FlexLayout,
    QTreeWidgetItem, 
    QTreeWidget,
    QIcon,
    ItemDataRole,
    CheckState,
} from "@nodegui/nodegui";
import path from "path";
import {compareLocalFileInfoWithOnlineFileInfo} from '../fsHandling/helpers';
import {getOnlineVersions} from '../crypto/arweave-helpers';
import {configureWithPathsFromInfo} from './InitialSetupDialog';
import {settings} from '../config';
import { ConfirmDeletedFile, AddFileToDownloads, AddPendingFile, RemoveProposedFile, InDownloadQueue } from "../db/helpers";

export const USER_DATA_ROLE = 20;

const folder_icon_path = path.join(
    process.cwd(), 
    'assets/images/folder_icon.png'
  );
  
  const file_delete_icon_file = path.join(
    process.cwd(), 
    'assets/images/delete_file.png'
  );

  const file_upload_icon_file = path.join(
    process.cwd(), 
    'assets/images/upload_file.png'
  );

  const file_download_icon_file = path.join(
    process.cwd(), 
    'assets/images/download_file.png'
  );

let main_win = null;

export const refreshReviewSyncDialog = (path_infos, saveCallback, cancelCallback) => {
  main_win.hide();

  openReviewSyncDialog(path_infos, saveCallback, cancelCallback);
}

export const openReviewSyncDialog = (path_infos, saveCallback, cancelCallback) => {
    const syncWin = new QMainWindow();
    main_win = syncWin;

    syncWin.setWindowTitle("Selective Sync");
    syncWin.setWindowIcon(new QIcon(settings.NOTIFY_ICON_PATH));
    const syncRootView = new QWidget();
    syncRootView.setObjectName("rootView");
    const syncRootViewLayout = new FlexLayout()
    syncRootView.setLayout(syncRootViewLayout);

    const tree = new QTreeWidget();

    createFolderItems(path_infos, tree, syncWin, true, null);

    const OnChange = (item, column) => {
        const serialised_path_info = JSON.parse(item.data(0, USER_DATA_ROLE).toString());
    
        const path_info = getOriginalPathInfoInstance(serialised_path_info, path_infos);
    
        const checked = item.data(0, ItemDataRole.CheckStateRole).toInt();
    
        path_info.checked = checked == CheckState.Checked ? true : false;
    
        if(path_info.type == "folder") {
            toggleAllchildren(path_info);
        }
    }

    tree.addEventListener("itemChanged", OnChange);

    syncRootViewLayout.addWidget(tree);

    createSyncActionsRow(path_infos, syncRootView, syncWin, saveCallback, cancelCallback);

    syncWin.setCentralWidget(syncRootView);         
    syncWin.show();
}

export default openReviewSyncDialog;



const getOriginalPathInfoInstance = (path_info, path_infos) => {
    if(path_info.path == path_infos.path && path_info.name == path_infos.name) {
      return path_infos;
    }
  
    for(let i in path_infos.children) {
      const pi = path_infos.children[i];
  
      if(pi.path == path_info.path && pi.name == path_info.name) {
        return pi;
      }
  
      if(pi.type == "folder") {
        return getOriginalPathInfoInstance(path_info, pi);
      }
    }
  }
  
  const toggleAllchildren = (path_info) => {
    for(let i in path_info.children) {
      const pi = path_info.children[i];
  
      const checked = path_info.checked == true ? CheckState.Checked : CheckState.Unchecked;
      pi.control.setCheckState(0, checked);
    }
  }
  
  const createSyncActionsRow = (path_infos, syncRootView, win, saveCallback, cancelCallback
    ) => {
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
      saveCallback(path_infos);
      win.hide();   
    });
  
    actionsLayout.addWidget(btnSave);
  
    const btnCancel = new QPushButton();
    btnCancel.setText("Cancel");
    btnCancel.setObjectName(`btnCancel`);
  
    btnCancel.addEventListener("clicked", () => {
       if(cancelCallback) {
        cancelCallback(path_infos);
      }
      win.hide();     
    });
  
    actionsLayout.addWidget(btnCancel, btnCancel.getFlexNode(), );
  
    syncRootView.layout.addWidget(actions);
  }
  
const createFolderItems = (parent_path_info, tree, window, root, grand_parent) => {
    for(let i in parent_path_info.children) {
        const path_info = parent_path_info.children[i];
        if(path_info.type == "folder") {
            let folder_item = null;
            
            if(root) {
                folder_item = new QTreeWidgetItem();
                tree.addTopLevelItem(folder_item);
            } else {
                folder_item = new QTreeWidgetItem(grand_parent);
            }
            folder_item.setText(0, path_info.name);
            createFolderItems(path_info, tree, window, false, folder_item);
            

            folder_item.setText(0, path_info.name);
            folder_item.setIcon(0, new QIcon(folder_icon_path));

            let checked = CheckState.Unchecked;

            if(path_info.checked) {
                checked = CheckState.Checked;
            }

            folder_item.setData(0, USER_DATA_ROLE, JSON.stringify(path_info));
            folder_item.setCheckState(0, checked);

            path_info['control'] = folder_item;

        } else {
            let file_item = null;
            if(root) {
                file_item = new QTreeWidgetItem();
                tree.addTopLevelItem(file_item);
            } else {
                file_item = new QTreeWidgetItem(grand_parent);
            }

            file_item.setText(0, path_info.name);

            switch(path_info.action) {
              case "delete":
                file_item.setIcon(0, new QIcon(file_delete_icon_file));
                break;
              case "upload":
                file_item.setIcon(0, new QIcon(file_upload_icon_file));
                break;
              case "download":
                file_item.setIcon(0, new QIcon(file_download_icon_file));
                break;
            }

            let checked = CheckState.Unchecked;
            if(path_info.checked) {
                checked = CheckState.Checked;
            }
            
            file_item.setData(0, USER_DATA_ROLE, JSON.stringify(path_info));
            file_item.setCheckState(0, checked);

            path_info['control'] = file_item;
        }
    }

  return grand_parent;
}


export const processToQueues = async (path_infos) => {
  await Promise.all(path_infos.children.map(async file_info => {
    if(file_info.type == 'folder') {
      await processToQueues(file_info);
    } else {
      if(file_info.checked) {
        await addToQueue(file_info);
      }            
    }
  }));
}

export const addToQueue = async (file_info) => {
  switch(file_info.action) {
    case "download":
      AddFileToDownloads(file_info);
      break;
    case "delete":
      ConfirmDeletedFile(file_info.tx_id);
      break;
    case "upload":
      const online_versions = await getOnlineVersions(file_info);

      if(online_versions.length == 0) {
          AddPendingFile(null, file_info.path, file_info.version, file_info.is_update);
      } else {
          online_versions.sort((a, b) => a.modified - b.modified);

          const online_version = online_versions[online_versions.length - 1];

          if(file_info.version <= online_version.version) {
            AddPendingFile(null, file_info.path, online_version.version + 1);
          } else {
            AddPendingFile(null, file_info.path, file_info.version);
          }
          
      }

      RemoveProposedFile(file_info.path);

      break;
  }
}