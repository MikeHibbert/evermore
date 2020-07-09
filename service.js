const chokidar = require('chokidar');
const config = require('config');

const FS_ROOT = config.get("Application.FS_ROOT");

// One-liner for current directory
chokidar.watch(FS_ROOT).on('all', (event, path) => {
  console.log(event, path);
});