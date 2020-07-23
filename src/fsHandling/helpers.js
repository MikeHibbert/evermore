const fs = require('fs');

export const getFileUpdatedDate = (path) => {
  const stats = fs.statSync(path);
  return stats.mtime.toISOString();
}

export const fileHasBeenModified = (path) => {
    
}