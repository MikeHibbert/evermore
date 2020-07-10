import fs from 'fs-extra';
import path from 'path';

const Logo = fs.readFileSync(path.join(__dirname, `../assets/images/tray-logo16x16.${process.platform === 'win32' ? 'ico' : 'png'}`))

module.exports = Logo;