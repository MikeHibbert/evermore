'use strict';

const path = require('path');

const fs = jest.createMockFromModule('fs');

const test_files = {};

test_files["wallet_file.json"] = {path: "wallet_file.json", data: "12345566234324234"};
test_files["a_test_upload_file.txt"] = {path: "a_test_upload_file.txt", data: "some test data"};

fs.readFileSync = (file_path) => {
    return test_files[file_path].data;
}
fs.access = (path, callback) => {
    if(test_files.hasOwnProperty(path)) {
        callback(true);
    } else {
        callback(false);
    }
}

module.exports = fs;

