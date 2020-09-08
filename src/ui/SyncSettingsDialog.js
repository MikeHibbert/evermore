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

export const USER_DATA_ROLE = 20;

const folder_icon_path = path.join(
    process.cwd(), 
    `assets/images/${process.platform === 'win32' ? 'folder_icon.png' : 'folder_icon.png'}`
  );
  
  const file_icon_file = path.join(
    process.cwd(), 
    `assets/images/${process.platform === 'win32' ? 'folder_icon.png' : 'folder_icon.png'}`
  );

const openSyncSettingsDialog = (folders) => {
    const syncWin = new QMainWindow();
    const syncRootView = new QWidget();
    syncRootView.setObjectName("rootView");
    const syncRootViewLayout = new FlexLayout()
    syncRootView.setLayout(syncRootViewLayout);

    const tree = new QTreeWidget();

    createFolderItems(folders[''], tree, syncWin, true, null);

    const OnChange = (item, column) => {
        const serialised_path_info = JSON.parse(item.data(0, USER_DATA_ROLE).toString());
    
        const path_info = getOriginalPathInfoInstance(serialised_path_info, folders['']);
    
        const checked = item.data(0, ItemDataRole.CheckStateRole).toInt();
    
        path_info.checked = checked == CheckState.Checked ? true : false;
    
        if(path_info.type == "folder") {
            toggleAllChilderen(path_info);
        }
    }

    tree.addEventListener("itemChanged", OnChange);

    syncRootViewLayout.addWidget(tree);

    createSyncActionsRow(folders, syncRootView, syncWin);

    syncWin.setCentralWidget(syncRootView);         
    syncWin.show();
}

export default openSyncSettingsDialog;



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
  
  const createSyncActionsRow = (folders, syncRootView, win) => {
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