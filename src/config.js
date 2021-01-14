const { platform } = require('os');
const fs = require('fs');
const path = require('path');
const windowsShortcutsAppid = require("windows-shortcuts-appid");
const { createLogger, transports } = require('winston');

const home_folder = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share");
const group_container = process.platform == 'darwin' ? process.env.HOME + '/Library/Group Containers/': '';

let APPLICATION_REV_DOMAIN = 'Evermore';

if(process.platform == 'darwin') {
    APPLICATION_REV_DOMAIN = 'com.evermoredata.store';
}

console.log(path.join(home_folder, APPLICATION_REV_DOMAIN));

let appID = undefined;
if(process.platform == 'win32') {
    appID = "com.evermore.desktopclient";
    if(process.cwd().endsWith('system32')) { // Windows has screwed up so set the CWD properly
        const cwd_path = process.execPath.replace('\\qode.exe', '');
        process.chdir(cwd_path);
    }
}



if(!fs.existsSync(path.join(home_folder, APPLICATION_REV_DOMAIN))) {
    fs.mkdirSync(path.join(home_folder, APPLICATION_REV_DOMAIN));
    fs.mkdirSync(path.join(home_folder, APPLICATION_REV_DOMAIN, 'logs'));
}

const logger = createLogger({
    transports: [
      new transports.File({ filename: path.join(home_folder, APPLICATION_REV_DOMAIN, 'logs', 'errors.log'), level: 'error' }) 
    ],
    exceptionHandlers: [
      new transports.File({ filename: path.join(home_folder, APPLICATION_REV_DOMAIN, 'logs', 'exceptions.log') })
    ]
  });


console.log(path.join(home_folder, APPLICATION_REV_DOMAIN, 'logs'));

let settings = {
    APP_NAME: 'EvermoreDatastore-v0.9.2',
    PLATFORM: process.platform,
    CONTRACT_ADDRESS: '1TFZeEewEgUpqT5i2dsZSIRKJq3h1C7ZVi-gE8G-W6U',
    USAGE_PERCENTAGE: 0.2, // 20% usage cost
    ARWEAVE_CONFIG: {
        host: "arweave.net",
        port: 443,
        protocol: 'https',
        timeout: 20000,
        logging: false
    }, 
    APPLICATION_REV_DOMAIN: APPLICATION_REV_DOMAIN,
    LOGGER: logger,
    HOME_FOLDER: path.join(home_folder, APPLICATION_REV_DOMAIN),
    GROUP_CONTAINER: group_container, 
    DB_PATH:  path.join(home_folder, APPLICATION_REV_DOMAIN, 'evermore-db.json'),
    NOTIFY_ICON_PATH: path.join(
        process.cwd(), 
        process.platform == 'win32' ? "assets\\images\\facebook-logo.png" : "assets/images/facebook-logo.png"
    ),
    SETUP_STAGE_1: path.join(
        process.cwd(), 
        process.platform == 'win32' ? "assets\\images\\setup-1.png" : "assets/images/setup-1.png" 
    ),
    SETUP_STAGE_2: path.join(
        process.cwd(), 
        process.platform == 'win32' ? "assets\\images\\setup-2.png" : "assets/images/setup-2.png"
    ),
    SETUP_STAGE_3: path.join(
        process.cwd(), 
        process.platform == 'win32' ? "assets\\images\\setup-3.png" : "assets/images/setup-3.png"
    ),
    SETUP_SELECTIVE_SYNC: path.join(
        process.cwd(), 
        process.platform == 'win32' ? "assets\\images\\setup-selective-sync.png" : "assets/images/setup-selective-sync.png"
    ),
    GRAPHQL_ENDPOINT: 'https://arweave.net/graphql',
    API_NOTIFIER_ID: appID // "com.evermore.desktopclient" // process.platform == 'win32' ? "{1A56A85B-CAD4-4FF9-B8E2-F79559702F30}" : undefined
}

if(typeof jest != "undefined") {
    settings.DB_PATH = "test_db.json";
}



exports.settings = settings;