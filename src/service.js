const chokidar = require('chokidar');
const config = require('config');
import initSystemTray from './system-tray'; // setup system tray menu etc
import fileAddedHandler from './fsHandling/AddFile';
import fileChangedHandler from './fsHandling/ChangeFile';
import fileDeletedHandler from './fsHandling/DeleteFile';
import dirAddedHandler from './fsHandling/AddDir';
import dirDeletedHandler from './fsHandling/DeleteDir';
import { OnFileWatcherReady } from './fsHandling/Init';

const FS_ROOT = config.get("Application.FS_ROOT");

const systray = initSystemTray();

const log = console.log.bind(console);
// One-liner for current directory
chokidar.watch(FS_ROOT)
  .on('add', path => fileAddedHandler(path))
  .on('change', path => fileChangedHandler(path))
  .on('unlink', path => fileDeletedHandler(path))
  .on('addDir', path => dirAddedHandler(path))
  .on('unlinkDir', path => dirDeletedHandler(path))
  .on('error', error => log(`Watcher error: ${error}`))
  .on('ready', () => OnFileWatcherReady());



