const path = require('path');
const fs = jest.requireActual('fs');
const Arweave = jest.requireActual('arweave/node');
const settings = require('../config');
const { 
    wallet2PEM,
    encryptDataWithRSAKey,
    decryptDataWithRSAKey,
    decryptDataWithWallet,
    getFileEncryptionKey,
    encryptFile
} = require('./files');

const { InitDB, setWalletFilePath } = require('../db/helpers'); 

import regeneratorRuntime from "regenerator-runtime";

beforeAll(function () {
    if(fs.accessSync(path.join(process.cwd(), 'README.md.enc'), fs.constants.W_OK)) {
       return fs.unlinkSync(path.join(process.cwd(), 'README.md.enc'));
    }
 });

afterAll(() => {
    if(fs.accessSync(path.join(process.cwd(), 'README.md.enc'), fs.constants.W_OK)) {
       return fs.unlinkSync(path.join(process.cwd(), 'README.md.enc'));
   }
 });

test("Should encrypt data and decrypt back to orriginal data using same JWK", async () => {
    const aw = Arweave.init(settings.ARWEAVE_CONFIG);

    const jwk = await aw.wallets.generate();

    const key = wallet2PEM(jwk);

    const original_data = "Three Blind Mice";

    const encrypted_data = encryptDataWithRSAKey(original_data, key.private);

    const decrypted_data = decryptDataWithRSAKey(encrypted_data, key.private).toString('utf8');

    expect(decrypted_data).toBe(original_data);
});

test("Should decrypt data encoded with a specific wallet", async () => {
    const aw = Arweave.init(settings.ARWEAVE_CONFIG);

    const wallet = await aw.wallets.generate();

    const key = wallet2PEM(wallet);

    const original_data = key.private;

    const encrypted_data = encryptDataWithRSAKey(original_data, key.private);

    const decrypted_data = decryptDataWithWallet(encrypted_data, wallet).toString('utf8');

    expect(decrypted_data).toBe(original_data);
});

test("getFileEncryptionKey should return the same key that was supplied to create new encrypted file", async () => {
    process.title = "node"; // needed so tests will not pretend to be in the browser for the NodeRSA module
    
    const aw = Arweave.init(settings.ARWEAVE_CONFIG);

    const wallet = await aw.wallets.generate();
    const jwk = await aw.wallets.generate();
    const key = wallet2PEM(jwk);

    const result = await encryptFile(
        wallet, 
        jwk, 
        path.join(process.cwd(), 'README.md'), 
        path.join(process.cwd(), 'README.md.enc')
    );

    const original_data = key.private;

    const decrypted_data = await getFileEncryptionKey(result.file_path, result, wallet);

    expect(decrypted_data).toBe(original_data);

    return;
});
