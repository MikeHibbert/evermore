const fs = jest.requireActual('fs');
import { settings } from '../config';
const path = require('path');
import {
    getOfflineFilesAndFoldersStructure,
    comparePathInfos, 
    createCRCFor,
    setFileUpdatedDatetime,
    diffPathInfos,
    mergePathInfos,
    removePathInfosWithChecked,
    pathFoundInPathInfos,
    pathFoundInFolderPathInfos
} from './helpers';

const { crc32 } = require('crc');

import {AddSyncedFolder, GetSyncedFolders, InitDB} from '../db/helpers';
import { resolve } from 'path';

const pathInfosJSON = '{"":{"index":-1,"id":"root","type":"folder","name":"","children":[{"id":"RZZfLBu2VlnkZgMRYq9XqtJoS2iyRfLWKiTQp4QMjao","checked":true,"App":"EvermoreDatastore","path":"\Desktop.ini","modified":1596523970281,"hostname":"DESKTOP-26VMO3F","name":"Desktop.ini","index":1,"type":"file"},{"id":"zBU4VLMhPUGmS9ihRdEqEhryeyO3Qq_Ju9DN24JwcM4","checked":true,"App":"EvermoreDatastore","path":"\New Text Document.txt","modified":1595868023843,"hostname":"DESKTOP-26VMO3F","name":"New Text Document.txt","index":1,"type":"file"},{"id":"boHIUS1KaGih9zdb8-hyYheODAGtMKQ6vPW1_uh2U3w","checked":true,"App":"EvermoreDatastore","path":"\Test\Hamster.bmp","modified":1595789196374,"hostname":"DESKTOP-26VMO3F","name":"Test","index":1,"type":"folder","children":[{"id":"boHIUS1KaGih9zdb8-hyYheODAGtMKQ6vPW1_uh2U3w","checked":true,"App":"EvermoreDatastore","path":"\Test\Hamster.bmp","modified":1595789196374,"hostname":"DESKTOP-26VMO3F","name":"Hamster.bmp","index":2,"type":"file"},{"id":"lJAqZOW9yDQygX2GqSuThWby2jZt3X6EW7RzKfrn5nw","checked":true,"App":"EvermoreDatastore","path":"\Test\New Text Document.txt","modified":1594275818661,"hostname":"DESKTOP-26VMO3F","name":"New Text Document.txt","index":2,"type":"file"}]},{"id":"QhIdQ5RwL7aoE7pya4obrx7BgeBlRSgxJzyzDm_UFck","checked":true,"App":"EvermoreDatastore","path":"\Desktop.ini","modified":1596523970281,"hostname":"DESKTOP-26VMO3F","name":"Desktop.ini","index":1,"type":"file"},{"id":"vPOQlEPA-RAcPGOUKonW4fL0_72Ohkj9xF6RQGEf8Ek","checked":true,"App":"EvermoreDatastore","path":"\New Text Document.txt","modified":1595868023843,"hostname":"DESKTOP-26VMO3F","name":"New Text Document.txt","index":1,"type":"file"}]}}';

beforeAll(() => {
    InitDB();
})

afterAll(() => {
    if(fs.existsSync(path.join(process.cwd(), settings.DB_PATH))) {
       return fs.unlinkSync(settings.DB_PATH);
    }
    if(fs.existsSync(path.join(process.cwd(), settings.DB_PATH))) {
        return fs.unlinkSync(settings.DB_PATH);
    }
 });

 describe("Filesystem Ops", () => {
    test("Should list files and all folder recursively", () => {
        const current_folder = path.join(process.cwd(), 'src');

        const matches = GetSyncedFolders().filter(folder => folder.path == current_folder);

        if(matches.length == 0) {
            AddSyncedFolder(current_folder);
        }
        
        getOfflineFilesAndFoldersStructure((path_infos) => {
            expect(path_infos[''].children.length).toBeGreaterThan(0);
        });    
    });

    test("Path Info Objects should match eachother", () => {
        const pathInfos = JSON.parse(pathInfosJSON);
        const isSame = comparePathInfos(pathInfos[''], pathInfos['']);

        expect(isSame).toBe(true);
    });

    test("Should create an empty diff of path_infos because all are the same", () => {
        const pathInfos = JSON.parse(pathInfosJSON);

        const diff_of_path_infos = diffPathInfos(pathInfos[''], pathInfos[''], true)

        expect(diff_of_path_infos[''].children.length).toBe(0);
    });

    test("Should create an full set of path_infos because all are the same but modified dates are newer", () => {
        const newerPathInfosJSON = '{"":{"index":-1,"id":"root","type":"folder","name":"","children":[{"id":"RZZfLBu2VlnkZgMRYq9XqtJoS2iyRfLWKiTQp4QMjao","checked":true,"App":"EvermoreDatastore","path":"\Desktop.ini","modified":1596523970282,"hostname":"DESKTOP-26VMO3F","name":"Desktop.ini","index":1,"type":"file"},{"id":"zBU4VLMhPUGmS9ihRdEqEhryeyO3Qq_Ju9DN24JwcM4","checked":true,"App":"EvermoreDatastore","path":"\New Text Document.txt","modified":1595868023844,"hostname":"DESKTOP-26VMO3F","name":"New Text Document.txt","index":1,"type":"file"},{"id":"boHIUS1KaGih9zdb8-hyYheODAGtMKQ6vPW1_uh2U3w","checked":true,"App":"EvermoreDatastore","path":"\Test\Hamster.bmp","modified":1595789196375,"hostname":"DESKTOP-26VMO3F","name":"Test","index":1,"type":"folder","children":[{"id":"boHIUS1KaGih9zdb8-hyYheODAGtMKQ6vPW1_uh2U3w","checked":true,"App":"EvermoreDatastore","path":"\Test\Hamster.bmp","modified":1595789196376,"hostname":"DESKTOP-26VMO3F","name":"Hamster.bmp","index":2,"type":"file"},{"id":"lJAqZOW9yDQygX2GqSuThWby2jZt3X6EW7RzKfrn5nw","checked":true,"App":"EvermoreDatastore","path":"\Test\New Text Document.txt","modified":1594275818662,"hostname":"DESKTOP-26VMO3F","name":"New Text Document.txt","index":2,"type":"file"}]},{"id":"QhIdQ5RwL7aoE7pya4obrx7BgeBlRSgxJzyzDm_UFck","checked":true,"App":"EvermoreDatastore","path":"\Desktop.ini","modified":1596523970282,"hostname":"DESKTOP-26VMO3F","name":"Desktop.ini","index":1,"type":"file"},{"id":"vPOQlEPA-RAcPGOUKonW4fL0_72Ohkj9xF6RQGEf8Ek","checked":true,"App":"EvermoreDatastore","path":"\New Text Document.txt","modified":1595868023844,"hostname":"DESKTOP-26VMO3F","name":"New Text Document.txt","index":1,"type":"file"}]}}';

        const pathInfos = JSON.parse(pathInfosJSON);
        const newerPathInfos = JSON.parse(newerPathInfosJSON);

        const diff_of_path_infos = diffPathInfos(pathInfos[''], newerPathInfos[''], true)

        expect(diff_of_path_infos[''].children.length).toBe(pathInfos[''].children.length);
    });

    test("Should create one path_info in the Test folder because all are the same but modified dates are older", () => {
        const newerPathInfosJSON = '{"":{"index":-1,"id":"root","type":"folder","name":"","children":[{"id":"RZZfLBu2VlnkZgMRYq9XqtJoS2iyRfLWKiTQp4QMjao","checked":true,"App":"EvermoreDatastore","path":"\Desktop.ini","modified":1596523970281,"hostname":"DESKTOP-26VMO3F","name":"Desktop.ini","index":1,"type":"file"},{"id":"zBU4VLMhPUGmS9ihRdEqEhryeyO3Qq_Ju9DN24JwcM4","checked":true,"App":"EvermoreDatastore","path":"\New Text Document.txt","modified":1595868023843,"hostname":"DESKTOP-26VMO3F","name":"New Text Document.txt","index":1,"type":"file"},{"id":"boHIUS1KaGih9zdb8-hyYheODAGtMKQ6vPW1_uh2U3w","checked":true,"App":"EvermoreDatastore","path":"\Test\Hamster.bmp","modified":1595789196374,"hostname":"DESKTOP-26VMO3F","name":"Test","index":1,"type":"folder","children":[{"id":"boHIUS1KaGih9zdb8-hyYheODAGtMKQ6vPW1_uh2U3w","checked":true,"App":"EvermoreDatastore","path":"\Test\Hamster.bmp","modified":1595789196374,"hostname":"DESKTOP-26VMO3F","name":"Hamster.bmp","index":2,"type":"file"},{"id":"lJAqZOW9yDQygX2GqSuThWby2jZt3X6EW7RzKfrn5nw","checked":true,"App":"EvermoreDatastore","path":"\Test\New Text Document.txt","modified":1594275818662,"hostname":"DESKTOP-26VMO3F","name":"New Text Document.txt","index":2,"type":"file"}]},{"id":"QhIdQ5RwL7aoE7pya4obrx7BgeBlRSgxJzyzDm_UFck","checked":true,"App":"EvermoreDatastore","path":"\Desktop.ini","modified":1596523970281,"hostname":"DESKTOP-26VMO3F","name":"Desktop.ini","index":1,"type":"file"},{"id":"vPOQlEPA-RAcPGOUKonW4fL0_72Ohkj9xF6RQGEf8Ek","checked":true,"App":"EvermoreDatastore","path":"\New Text Document.txt","modified":1595868023843,"hostname":"DESKTOP-26VMO3F","name":"New Text Document.txt","index":1,"type":"file"}]}}';
        const pathInfos = JSON.parse(pathInfosJSON);
        const newerPathInfos = JSON.parse(newerPathInfosJSON);

        const diff_of_path_infos = diffPathInfos(pathInfos[''], newerPathInfos[''], true)

        expect(diff_of_path_infos[''].children.length).toBe(1);
        expect(diff_of_path_infos[''].children[0].name).toBe('Test');
        expect(diff_of_path_infos[''].children[0].children.length).toBe(1);
        expect(diff_of_path_infos[''].children[0].children[0].name).toBe("New Text Document.txt");
    });

    test("Should be able to generate CRC from large file", async  () => {
        const crc_no_buffering = crc32(fs.readFileSync(path.join(process.cwd(), 'README.md'), 'utf-8')).toString(16);

        const crc_result = await createCRCFor(path.join(process.cwd(), 'README.md'));

        expect(crc_result).toBe(crc_no_buffering);    
    });

    test("Should be able to set the last modified time and accessed time to a specific time", async  () => {
        const file_path = path.join(process.cwd(), 'test.txt');   
        fs.writeFileSync(file_path, "this is a test", 'utf8');

        const now = new Date().getTime();
        const new_timestamp = now - 86400000;

        setFileUpdatedDatetime(file_path, new_timestamp);

        const stats = fs.statSync(file_path);

        const mtime_timestamp = stats.mtime.getTime();
        const atime_timestamp = stats.atime.getTime();

        expect(mtime_timestamp).toBe(new_timestamp);
        expect(atime_timestamp).toBe(new_timestamp);

        fs.unlinkSync(file_path);
    });

    test("Should return a merged set of path_infos built from two sets provided", () => {
        const newerPathInfosJSON = '{"":{"index":-1,"id":"root","type":"folder","name":"","children":[{"id":"RZZfLBu2VlnkZgMRYq9XqtJoS2iyRfLWKiTQp4QMjao","checked":true,"App":"EvermoreDatastore","path":"\Desktop.ini","modified":1596523970281,"hostname":"DESKTOP-26VMO3F","name":"Desktop.ini","index":1,"type":"file"},{"id":"1ZZfLBu2VlnkZgMRYq9XqtJoS2iyRfLWKiTQp4QMjao","checked":true,"App":"EvermoreDatastore","path":"\Cheese.ini","modified":1596523970281,"hostname":"DESKTOP-26VMO3F","name":"Cheese.ini","index":1,"type":"file"},{"id":"zBU4VLMhPUGmS9ihRdEqEhryeyO3Qq_Ju9DN24JwcM4","checked":true,"App":"EvermoreDatastore","path":"\New Text Document.txt","modified":1595868023843,"hostname":"DESKTOP-26VMO3F","name":"New Text Document.txt","index":1,"type":"file"},{"id":"boHIUS1KaGih9zdb8-hyYheODAGtMKQ6vPW1_uh2U3w","checked":true,"App":"EvermoreDatastore","path":"\Test\Hamster.bmp","modified":1595789196374,"hostname":"DESKTOP-26VMO3F","name":"Test","index":1,"type":"folder","children":[{"id":"boHIUS1KaGih9zdb8-hyYheODAGtMKQ6vPW1_uh2U3w","checked":true,"App":"EvermoreDatastore","path":"\Test\Hamster.bmp","modified":1595789196374,"hostname":"DESKTOP-26VMO3F","name":"Hamster.bmp","index":2,"type":"file"},{"id":"lJAqZOW9yDQygX2GqSuThWby2jZt3X6EW7RzKfrn5nw","checked":true,"App":"EvermoreDatastore","path":"\Test\New Text Document.txt","modified":1594275818662,"hostname":"DESKTOP-26VMO3F","name":"New Text Document.txt","index":2,"type":"file"}]},{"id":"QhIdQ5RwL7aoE7pya4obrx7BgeBlRSgxJzyzDm_UFck","checked":true,"App":"EvermoreDatastore","path":"\Desktop.ini","modified":1596523970281,"hostname":"DESKTOP-26VMO3F","name":"Desktop.ini","index":1,"type":"file"},{"id":"vPOQlEPA-RAcPGOUKonW4fL0_72Ohkj9xF6RQGEf8Ek","checked":true,"App":"EvermoreDatastore","path":"\New Text Document.txt","modified":1595868023843,"hostname":"DESKTOP-26VMO3F","name":"New Text Document.txt","index":1,"type":"file"}]}}';
        const pathInfos = JSON.parse(pathInfosJSON);
        const newerPathInfos = JSON.parse(newerPathInfosJSON);

        const merged_path_infos = mergePathInfos(newerPathInfos[''], pathInfos[''], true);

        expect(merged_path_infos[''].children.length).toBe(6);
        const cheese_files_found = merged_path_infos[''].children.filter(item => item.type == 'file' && item.name == "Cheese.ini")
        expect(cheese_files_found.length).toBe(1);
        const test_folder_found = merged_path_infos[''].children.filter(item => item.type == 'folder' && item.name == "Test")

        expect(test_folder_found.length).toBe(1);
        expect(test_folder_found[0].children.length).toBe(2);
        
    });

    test("Should return remove any path_infos that done have 'checked' set to correct value", () => {
        const firstPathInfosJSON = '{"":{"index":-1,"id":"root","type":"folder","name":"","children":[{"id":"RZZfLBu2VlnkZgMRYq9XqtJoS2iyRfLWKiTQp4QMjao","checked":false,"App":"EvermoreDatastore","path":"\Desktop.ini","modified":1596523970281,"hostname":"DESKTOP-26VMO3F","name":"Desktop.ini","index":1,"type":"file"},{"id":"1ZZfLBu2VlnkZgMRYq9XqtJoS2iyRfLWKiTQp4QMjao","checked":true,"App":"EvermoreDatastore","path":"\Cheese.ini","modified":1596523970281,"hostname":"DESKTOP-26VMO3F","name":"Cheese.ini","index":1,"type":"file"},{"id":"zBU4VLMhPUGmS9ihRdEqEhryeyO3Qq_Ju9DN24JwcM4","checked":true,"App":"EvermoreDatastore","path":"\New Text Document.txt","modified":1595868023843,"hostname":"DESKTOP-26VMO3F","name":"New Text Document.txt","index":1,"type":"file"},{"id":"boHIUS1KaGih9zdb8-hyYheODAGtMKQ6vPW1_uh2U3w","checked":true,"App":"EvermoreDatastore","path":"\Test\Hamster.bmp","modified":1595789196374,"hostname":"DESKTOP-26VMO3F","name":"Test","index":1,"type":"folder","children":[{"id":"boHIUS1KaGih9zdb8-hyYheODAGtMKQ6vPW1_uh2U3w","checked":true,"App":"EvermoreDatastore","path":"\Test\Hamster.bmp","modified":1595789196374,"hostname":"DESKTOP-26VMO3F","name":"Hamster.bmp","index":2,"type":"file"},{"id":"lJAqZOW9yDQygX2GqSuThWby2jZt3X6EW7RzKfrn5nw","checked":true,"App":"EvermoreDatastore","path":"\Test\New Text Document.txt","modified":1594275818662,"hostname":"DESKTOP-26VMO3F","name":"New Text Document.txt","index":2,"type":"file"}]},{"id":"QhIdQ5RwL7aoE7pya4obrx7BgeBlRSgxJzyzDm_UFck","checked":true,"App":"EvermoreDatastore","path":"\Desktop.ini","modified":1596523970281,"hostname":"DESKTOP-26VMO3F","name":"Desktop.ini","index":1,"type":"file"},{"id":"vPOQlEPA-RAcPGOUKonW4fL0_72Ohkj9xF6RQGEf8Ek","checked":true,"App":"EvermoreDatastore","path":"\New Text Document.txt","modified":1595868023843,"hostname":"DESKTOP-26VMO3F","name":"New Text Document.txt","index":1,"type":"file"}]}}';
        const firstPathInfos = JSON.parse(firstPathInfosJSON);

        const first_removed_path_infos = removePathInfosWithChecked(firstPathInfos[''], true);

        expect(first_removed_path_infos[''].children.length).toBe(firstPathInfos[''].children.length - 1);


        
        const secondPathInfosJSON = '{"":{"index":-1,"id":"root","type":"folder","name":"","children":[{"id":"RZZfLBu2VlnkZgMRYq9XqtJoS2iyRfLWKiTQp4QMjao","checked":true,"App":"EvermoreDatastore","path":"\Desktop.ini","modified":1596523970281,"hostname":"DESKTOP-26VMO3F","name":"Desktop.ini","index":1,"type":"file"},{"id":"1ZZfLBu2VlnkZgMRYq9XqtJoS2iyRfLWKiTQp4QMjao","checked":false,"App":"EvermoreDatastore","path":"\Cheese.ini","modified":1596523970281,"hostname":"DESKTOP-26VMO3F","name":"Cheese.ini","index":1,"type":"file"},{"id":"zBU4VLMhPUGmS9ihRdEqEhryeyO3Qq_Ju9DN24JwcM4","checked":false,"App":"EvermoreDatastore","path":"\New Text Document.txt","modified":1595868023843,"hostname":"DESKTOP-26VMO3F","name":"New Text Document.txt","index":1,"type":"file"},{"id":"boHIUS1KaGih9zdb8-hyYheODAGtMKQ6vPW1_uh2U3w","checked":false,"App":"EvermoreDatastore","path":"\Test\Hamster.bmp","modified":1595789196374,"hostname":"DESKTOP-26VMO3F","name":"Test","index":1,"type":"folder","children":[{"id":"boHIUS1KaGih9zdb8-hyYheODAGtMKQ6vPW1_uh2U3w","checked":false,"App":"EvermoreDatastore","path":"\Test\Hamster.bmp","modified":1595789196374,"hostname":"DESKTOP-26VMO3F","name":"Hamster.bmp","index":2,"type":"file"},{"id":"lJAqZOW9yDQygX2GqSuThWby2jZt3X6EW7RzKfrn5nw","checked":true,"App":"EvermoreDatastore","path":"\Test\New Text Document.txt","modified":1594275818662,"hostname":"DESKTOP-26VMO3F","name":"New Text Document.txt","index":2,"type":"file"}]},{"id":"QhIdQ5RwL7aoE7pya4obrx7BgeBlRSgxJzyzDm_UFck","checked":true,"App":"EvermoreDatastore","path":"\Desktop.ini","modified":1596523970281,"hostname":"DESKTOP-26VMO3F","name":"Desktop.ini","index":1,"type":"file"},{"id":"vPOQlEPA-RAcPGOUKonW4fL0_72Ohkj9xF6RQGEf8Ek","checked":true,"App":"EvermoreDatastore","path":"\New Text Document.txt","modified":1595868023843,"hostname":"DESKTOP-26VMO3F","name":"New Text Document.txt","index":1,"type":"file"}]}}';
        const secondPathInfos = JSON.parse(secondPathInfosJSON);

        const second_removed_path_infos = removePathInfosWithChecked(secondPathInfos[''], false);

        expect(second_removed_path_infos[''].children.length).toBe(3);    

        const test_folder_info = second_removed_path_infos[''].children.filter(pi => pi.name = "Test" && pi.type == 'folder')[0];

        expect(test_folder_info.children.length).toBe(1);    
    });

    test("Should find paths in path_infos", () => {
        const current_folder = path.join(process.cwd(), 'src');

        const matches = GetSyncedFolders().filter(folder => folder.path == current_folder);

        if(matches.length == 0) {
            AddSyncedFolder(current_folder);
        }

        getOfflineFilesAndFoldersStructure((path_infos) => {
            const path_in_root_folder_found = pathFoundInPathInfos(path.normalize("\\index.js"), path_infos['']);

            expect(path_in_root_folder_found).toBe(true); 

            const path_in_sub_folder_found = pathFoundInPathInfos(path.normalize("\\db\\helpers.js"), path_infos['']);

            expect(path_in_sub_folder_found).toBe(true); 

            const path_found_folder_paths_only = pathFoundInFolderPathInfos(path.normalize("\\crypto\\helpers.js"), path_infos['']);

            expect(path_found_folder_paths_only).toBe(true); 

            const folder_path_found_folder_paths_only = pathFoundInFolderPathInfos(path.normalize("\\crypto\\"), path_infos['']);

            expect(folder_path_found_folder_paths_only).toBe(true); 
        });

        
    });

    test("Should notify of registered and unregidtered folder", () => {
        getOfflineFilesAndFoldersStructure((path_infos) => {
            const exclusions = {"":{"index":-1,"id":"root","type":"folder","name":"","children":[]}};

            exclusions[''].children.push({...path_infos[''].children[0]});

            notifications = [];
            updateInclusionsAndExclusionOverlayPaths(exclusions, (message) => {
                notifications.push(message);
            })

            expect(notifications.length).toBeGreaterThan(0);
        });
        
    })
});