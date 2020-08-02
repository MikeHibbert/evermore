import { InitFileWatcher } from './fsHandling/Init';
import { InitDB } from './db/helpers';
import initSystemTray from './system-tray'; // setup system tray menu etc
import { walletFileSet, GetSyncedFolders } from './db/helpers';
import initNamePipe from './integration/server';

InitDB();

const systray = initSystemTray();

const wallet_path = walletFileSet();

initNamePipe();

if(wallet_path.length != 0) {
  const sync_folders = GetSyncedFolders();
  
  InitFileWatcher(sync_folders)
}



