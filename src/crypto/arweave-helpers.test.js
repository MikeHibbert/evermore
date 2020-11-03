jest.mock('fs');

const fs = jest.requireActual('fs');
const Arweave = jest.requireActual('arweave');
const { 
    arweave, 
    getJwkFromWalletFile,
    calculatePSTPayment, 
    sendUsagePayment, 
    uploadFile,
    getDownloadableFiles
} = require('./arweave-helpers');

const { interactWriteDryRun, readContract } = require('smartweave');

const { InitDB, setWalletFilePath } = require('../db/helpers'); 
const {settings} = require('../config');

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

test("Should get PST balance", async () => {
    const wallet_file = '/home/mike/Dropbox/hit solutions/Bitcoin/Arweave/arweave-keyfile-OFD5dO06Wdurb4w5TTenzkw1PacATOP-6lAlfAuRZFk.json';

    const rawdata = fs.readFileSync(wallet_file);
    const jwk = JSON.parse(rawdata);

    // const result = await interactWriteDryRun(arweave, jwk, 'ktzyKTMpH-HsLc8fuLcG2jzVO9V6mCFl4WC5lPWLRD8',
    //     {
    //         function: "balance", 
    //         target: "h-Bgr13OWUOkRGWrnMT0LuUKfJhRss5pfTdxHmNcXyw"
    //     }
    // );

    const aw = Arweave.init(settings.ARWEAVE_CONFIG);

    const contractId = '1TFZeEewEgUpqT5i2dsZSIRKJq3h1C7ZVi-gE8G-W6U'

    // const contractState = await readContract(aw, contractId);

    const tx = await arweave.transactions.get('1TFZeEewEgUpqT5i2dsZSIRKJq3h1C7ZVi-gE8G-W6U');

    //const tags = [];
    tx.get('tags').forEach(tag => {
        debugger;
        let key = tag.get('name', {decode: true, string: true});
        let value = tag.get('value', {decode: true, string: true});
        //tags.push({name: key, val: value});
        console.log(`${key} : ${value}`);
    });

    debugger;
    console.log(tx)
    
});

test("Should get downloadable files and return thier info", async () => {
    InitDB();

    const test_wallet_path = "wallet_file.json";
    setWalletFilePath(test_wallet_path);

    getDownloadableFiles().then(downloadable_files => {
        expect(downloadable_file.length).toBeGreaterThan(0);
    });
    
});


