jest.setTimeout(400000);

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
    encryptFile,
    decryptFile,
    zipKey,
    unzipKey
} = require('./files');

const { InitDB, setWalletFilePath } = require('../db/helpers'); 

import regeneratorRuntime from "regenerator-runtime";

beforeAll(function () {

});

afterEach(() => {
    if(fs.accessSync(path.join(process.cwd(), 'README.md.enc'), fs.constants.F_OK)) {
        debugger;
        return fs.unlinkSync(path.join(process.cwd(), 'README.md.enc'));
    }
    if(fs.accessSync(path.join(process.cwd(), 'README.md.dec'), fs.constants.F_OK)) {
        debugger;
        return fs.unlinkSync(path.join(process.cwd(), 'README.md.dec'));
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

test("decryptFile should return the same data that was supplied to create new encrypted file", async () => {    
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

    const original_data = fs.readFileSync(path.join(process.cwd(), 'README.md')).toString('utf8');

    const private_key = await getFileEncryptionKey(result.file_path, result, wallet);

    expect(private_key).toBe(key.private);

    const decrypted_result = await decryptFile(
        wallet, 
        private_key, 
        result.key_size, 
        result.file_path, 
        path.join(process.cwd(), 'README.md.dec')
    )

    const decrypted_data = fs.readFileSync(path.join(process.cwd(), 'README.md.dec')).toString('utf8');

    expect(decrypted_data).toBe(original_data);

    return;
});

test("zipKey should generate a smaller string than the private key supplied", async () => {
    const aw = Arweave.init(settings.ARWEAVE_CONFIG);

    const wallet = await aw.wallets.generate();

    const key = wallet2PEM(wallet);

    const original_data = key.private;

    const zipped_key = zipKey(original_data);

    expect(zipped_key.length).toBeLessThan(original_data.length);
});

test("unzipKey should generate the same result as zipKey's input", async () => {
    const aw = Arweave.init(settings.ARWEAVE_CONFIG);

    const wallet = await aw.wallets.generate();

    const key = wallet2PEM(wallet);

    const original_data = key.private;

    const zipped_key = zipKey(original_data);

    const unzipped_key = unzipKey(zipped_key);

    // console.table({original_data, zipped_key, unzipped_key});

    expect(unzipped_key).toBe(original_data);
});