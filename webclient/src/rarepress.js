import ipfs from './ipfs';

const Rarepress = require('rarepress.js');
const RAREPRESS_HOST = 'https://ropsten.rarepress.org/v0'

export default async function rarepressMint(file_data, name, description) {
    const rarepress = new Rarepress()

    const address = await rarepress.init({
        host: RAREPRESS_HOST
    });

    const ipfsHash = await rarepress.add(file_data);

    await rarepress.create({
        metadata: {
            name: name,
            description: description,
            image: `/ipfs/${ipfsHash}`
        }
    });

    debugger;

    return ipfsHash;
}
