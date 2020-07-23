const Arweave = require('arweave/node');
const fs = require('fs');

export const arweave = Arweave.init({
    host: "arweave.net",
    port: 443,
    protocol: 'https',
    timeout: 20000,
    logging: false
});

export const getJwkFromWalletFile = (path) => {
    const rawdata = fs.readFileSync(path);
    const jwk = JSON.parse(rawdata);

    return jwk;
}

export const getWalletBalance = (path) => {
    const jwk = getJwkFromWalletFile(path);

    return arweave.wallets.jwkToAddress(jwk).then((address) => {
        return arweave.wallets.getBalance(address).then((balance) => {
            return arweave.ar.winstonToAr(balance);
        })
    });
}

