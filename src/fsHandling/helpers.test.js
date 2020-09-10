const fs = jest.requireActual('fs');

import {
    getSyncPathInfos
} from './helpers';

import {AddSyncedFolder} from '../db/helpers';

test("Should list files and all folder recursively", () => {
    const current_folder = process.cwd();

    AddSyncedFolder(current_folder);

    getSyncPathInfos((file_infos) => {
        expect(file_infos[''].children.length).toBeGreaterThan(0);
    });   
});