import { InitFileWatcher } from './fsHandling/Init';
import { InitDB } from './db/helpers';
import initSystemTray from './qt-system-tray'; // setup system tray menu etc
import { walletFileSet, GetSyncedFolders } from './db/helpers';
import initNamePipe from './integration/server';
import OpenInitialSetupDialog from './ui/InitialSetupDialog';

InitDB();

const wallet_path = walletFileSet();

initNamePipe();

const systray = initSystemTray();

if(wallet_path.length != 0) {
  const sync_folders = GetSyncedFolders();
  
  InitFileWatcher(sync_folders)
} else {
    OpenInitialSetupDialog(systray)
}



