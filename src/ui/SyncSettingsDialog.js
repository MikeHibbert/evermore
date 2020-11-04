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
import {settings} from '../config';

export const USER_DATA_ROLE = 20;

const folder_icon_path = path.join(
    process.cwd(), 
    `assets/images/${process.platform === 'win32' ? 'folder_icon.png' : 'folder_icon.png'}`
  );
  
  const file_icon_file = path.join(
    process.cwd(), 
    `assets/images/${process.platform === 'win32' ? 'folder_icon.png' : 'folder_icon.png'}`
  );

let main_win = null;

export const refreshSyncSettingsDialog = (path_infos, saveCallback, cancelCallback) => {
  main_win.hide();

  openSyncSettingsDialog(path_infos, saveCallback, cancelCallback);
}

const openSyncSettingsDialog = (path_infos, saveCallback, cancelCallback) => {
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

export default openSyncSettingsDialog;



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
  
const createFolderItems = (path_info, tree, window, root, parent) => {
    if(!parent && !root) {
        parent = new QTreeWidgetItem();
        parent.setText(0, path_info.name);
    }

    for(let i in path_info.children) {
        const path = path_info.children[i];
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