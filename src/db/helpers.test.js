const fs = jest.requireActual('fs');
const { InitDB, walletFileSet, setWalletFilePath } = require('./helpers'); 
const { settings } = require('../config');

beforeEach(() => {
    fs.exists(settings.DB_PATH, (exists) => {
        if(!exists) {
            InitDB();
        }
    })
    
});

afterAll(() => {
    fs.exists(settings.DB_PATH, (exists) => {
        if(exists) {
            fs.unlinkSync(settings.DB_PATH);
        }
    })
    
});

test("Should set wallet file", () => {

    const test_wallet_path = "wallet_file.json";
    setWalletFilePath(test_wallet_path);
    
    const wallet_file = walletFileSet();

    expect(wallet_file).toBe(test_wallet_path);
});

