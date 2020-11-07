import { InitFileWatcher } from './fsHandling/Init';
import { InitDB } from './db/helpers';
import initSystemTray from './qt-system-tray'; // setup system tray menu etc
import { walletFileSet, GetSyncedFolders } from './db/helpers';
import initNamePipe from './integration/server';
import OpenInitialSetupDialog from './ui/InitialSetupDialog';
const Sentry = require("@sentry/node");
// or use es6 import statements
// import * as Sentry from '@sentry/node';

const Tracing = require("@sentry/tracing");
// or use es6 import statements
// import * as Tracing from '@sentry/tracing';

Sentry.init({
  dsn: "https://17007175c9e0415b856f78d220e11ab0@o472146.ingest.sentry.io/5505327",

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,
});

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



