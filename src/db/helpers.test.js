const fs = jest.requireActual('fs');
const { 
    InitDB, 
    walletFileSet, 
    setWalletFilePath,
    AddFileToDownloads,
    RemoveFileFromDownloads,
    GetDownloads,
    SyncPaused,
    SetSyncStatus
} = require('./helpers'); 
const path = require('path');
const { settings } = require('../config');

afterAll(() => {
    if(fs.existsSync(path.join(process.cwd(), settings.DB_PATH))) {
        return fs.unlinkSync(settings.DB_PATH);
    }
});

test("Should set wallet file", () => {

    const test_wallet_path = "wallet_file.json";
    setWalletFilePath(test_wallet_path);
    
    const wallet_file = walletFileSet();

    expect(wallet_file).toBe(test_wallet_path);
});

test("Should add File to downloads", () => {
    const file_to_add = {
        path: "123/456.png",
        name: "456.png",
        id: "1233445"
    };

    AddFileToDownloads(file_to_add);

    const download_files = GetDownloads();

    const match = download_files.filter(df => df.name == file_to_add.name && df.path == file_to_add.path);

    expect(match.length).toBe(1);
});

test("Should add File to downloads", () => { 
    RemoveFileFromDownloads("456.png", "123/456.png");

    const download_files = GetDownloads();

    const match = download_files.filter(df => df.name == file_to_add.name && df.path == file_to_add.path);

    expect(match.length).toBe(0);
});

test("Syncing can be paused", () => {
    SetSyncStatus(true);

    expect(SyncPaused()).toBe(true);
});

test("Syncing can be unpaused", () => {
    SetSyncStatus(true);

    expect(SyncPaused()).toBe(true);

    SetSyncStatus(false);

    expect(SyncPaused()).toBe(false);
});

