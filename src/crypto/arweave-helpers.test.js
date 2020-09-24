jest.mock('fs');
const path = require('path');
const Arweave = jest.requireActual('arweave/node');
const settings = require('../config');
const { 
    arweave, 
    calculatePSTPayment, 
    sendUsagePayment, 
    uploadFile,
    getDownloadableFiles, 
} = require('./arweave-helpers');

const { InitDB, setWalletFilePath } = require('../db/helpers'); 

import regeneratorRuntime from "regenerator-runtime";


test("Should get correct price for data storage", async () => {
    const price = await arweave.transactions.getPrice(1024);

    expect(parseInt(price)).toBeGreaterThan(0);
});

test("Should output a the correct percentage of a transaction cost", () => {
    const result = calculatePSTPayment(0.1, 0.2);

    expect(result).toBe(0.1 * 0.2); // should be 20%
});

test("Should send usage payment to PST", async () => {
    sendUsagePayment(0.2);
});

test("Should upload file", async () => {
    uploadFile({file: "a_test_upload_file.txt", path: "a_test_upload_file.txt"});
});

test("Should get downloadable files and return thier info", async () => {
    InitDB();

    const test_wallet_path = "wallet_file.json";
    setWalletFilePath(test_wallet_path);

    getDownloadableFiles().then(downloadable_files => {
        expect(downloadable_files.length).toBeGreaterThan(0);
    });
    
});
