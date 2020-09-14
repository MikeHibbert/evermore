const fs = jest.requireActual('fs');
const { settings } = require('../config');
const path = require('path');
import {
    getSyncPathInfos,
    comparePathInfos, createCRCFor
} from './helpers';

const { crc32 } = require('crc');

import {AddSyncedFolder, InitDB} from '../db/helpers';
import { resolve } from 'path';

const pathInfosJSON = '{"":{"index":-1,"id":"root","type":"folder","name":"","children":[{"id":"RZZfLBu2VlnkZgMRYq9XqtJoS2iyRfLWKiTQp4QMjao","checked":true,"App":"EvermoreDatastore","path":"\Desktop.ini","modified":1596523970281,"hostname":"DESKTOP-26VMO3F","name":"Desktop.ini","index":1,"type":"file"},{"id":"zBU4VLMhPUGmS9ihRdEqEhryeyO3Qq_Ju9DN24JwcM4","checked":true,"App":"EvermoreDatastore","path":"\New Text Document.txt","modified":1595868023843,"hostname":"DESKTOP-26VMO3F","name":"New Text Document.txt","index":1,"type":"file"},{"id":"boHIUS1KaGih9zdb8-hyYheODAGtMKQ6vPW1_uh2U3w","checked":true,"App":"EvermoreDatastore","path":"\Test\Hamster.bmp","modified":1595789196374,"hostname":"DESKTOP-26VMO3F","name":"Test","index":1,"type":"folder","children":[{"id":"boHIUS1KaGih9zdb8-hyYheODAGtMKQ6vPW1_uh2U3w","checked":true,"App":"EvermoreDatastore","path":"\Test\Hamster.bmp","modified":1595789196374,"hostname":"DESKTOP-26VMO3F","name":"Hamster.bmp","index":2,"type":"file"},{"id":"lJAqZOW9yDQygX2GqSuThWby2jZt3X6EW7RzKfrn5nw","checked":true,"App":"EvermoreDatastore","path":"\Test\New Text Document.txt","modified":1594275818661,"hostname":"DESKTOP-26VMO3F","name":"New Text Document.txt","index":2,"type":"file"}]},{"id":"QhIdQ5RwL7aoE7pya4obrx7BgeBlRSgxJzyzDm_UFck","checked":true,"App":"EvermoreDatastore","path":"\Desktop.ini","modified":1596523970281,"hostname":"DESKTOP-26VMO3F","name":"Desktop.ini","index":1,"type":"file"},{"id":"vPOQlEPA-RAcPGOUKonW4fL0_72Ohkj9xF6RQGEf8Ek","checked":true,"App":"EvermoreDatastore","path":"\New Text Document.txt","modified":1595868023843,"hostname":"DESKTOP-26VMO3F","name":"New Text Document.txt","index":1,"type":"file"}]}}';

beforeAll(() => {
    InitDB();
})

afterAll(() => {
    if(fs.existsSync(path.join(process.cwd(), settings.DB_PATH))) {
       return fs.unlinkSync(settings.DB_PATH);
   }
 });

test("Should list files and all folder recursively", () => {
    const current_folder = process.cwd();

    AddSyncedFolder(current_folder);

    getSyncPathInfos((path_infos) => {
        expect(path_infos[''].children.length).toBeGreaterThan(0);
    });   
});

test("Path Info Objects should match eachother", () => {
    const pathInfos = JSON.parse(pathInfosJSON);
    const isSame = comparePathInfos(pathInfos[''], pathInfos['']);

    expect(isSame).toBe(true);
});

test("Should be able to generate CRC from large file", async  () => {
    const crc_no_buffering = crc32(fs.readFileSync(path.join(process.cwd(), 'README.md'), 'utf-8')).toString(16)

    const crc_result = await createCRCFor(path.join(process.cwd(), 'README.md'));

    expect(crc_result).toBe(crc_no_buffering);    
});