const { platform } = require('os');
const fs = require('fs');
const path = require('path');

const home_folder = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share");
console.log(home_folder);

if(!fs.existsSync(path.join(home_folder, 'Evermore'))) {
    fs.mkdirSync(path.join(home_folder, 'Evermore'));
}

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
    DB_PATH:  path.join(home_folder, 'Evermore', 'evermore-db.json'),
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
    GRAPHQL_ENDPOINT: 'https://arweave.net/graphql'
}

if(process.platform != 'win32') {
    // TODO: set stuff up for alternate DB location if needs be
}

if(typeof jest != "undefined") {
    settings.DB_PATH = "test_db.json";
}

exports.settings = settings;