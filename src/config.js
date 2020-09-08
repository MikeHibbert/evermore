let settings = {
    APP_NAME: 'EvermoreDatastore',
    PLATFORM: process.platform,
    CONTRACT_ADDRESS: '1TFZeEewEgUpqT5i2dsZSIRKJq3h1C7ZVi-gE8G-W6U',
    USAGE_PERCENTAGE: 0.2, // 20% usage cost
    APP_CHECK_FREQUENCY: 30, // every 30 seconds
    ARWEAVE_CONFIG: {
        host: "arweave.net",
        port: 443,
        protocol: 'https',
        timeout: 20000,
        logging: false
    }, 
    DB_PATH: 'evermore-db.json'
}

if(typeof jest != "undefined") {
    settings.DB_PATH = "test_db.json";
}

exports.settings = settings;