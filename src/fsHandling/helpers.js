const fs = require('fs');

export const getFileUpdatedDate = (path) => {
  const stats = fs.statSync(path);
  return stats.mtime.getTime();
}

export const fileHasBeenModified = (path) => {
    
}