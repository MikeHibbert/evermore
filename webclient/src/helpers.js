import arweave from './arweave-config';
import { toast } from 'react-toastify';
import settings from './app-config';
import { readContract, selectWeightedPstHolder  } from 'smartweave';

function decode(str) {
    return str.replace(/&#(\d+);/g, function(match, dec) {
        return String.fromCharCode(dec);
    });
}

export const decrypt_mail = async (enc_data, key) => {
    var enc_key = new Uint8Array(enc_data.slice(0, 512))
    var enc_mail = new Uint8Array(enc_data.slice(512))

    var symmetric_key = await window.crypto.subtle.decrypt({ name: 'RSA-OAEP' }, key, enc_key)

    return arweave.crypto.decrypt(enc_mail, symmetric_key)
}

export const wallet_to_key = async (wallet) => {
    var w = Object.create(wallet)
    w.alg = 'RSA-OAEP-256'
    w.ext = true

    var algo = { name: 'RSA-OAEP', hash: { name: 'SHA-256' } }

    return await crypto.subtle.importKey('jwk', w, algo, false, ['decrypt'])
}

export const timeConverter = (UNIX_timestamp) => {
    var a = new Date(UNIX_timestamp * 1000)
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    var year = a.getFullYear()
    var month = months[a.getMonth()]
    var date = a.getDate()
    var hour = a.getHours()
    var min = a.getMinutes()
    var sec = a.getSeconds()
    var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec
    return time
}

export const getTotalCost = (transaction_cost) => {
    return transaction_cost + (transaction_cost * settings.USAGE_PERCENTAGE);
}

export const sendUsagePayment = async (jwk, transaction_cost) => {
    const contractState = await readContract(arweave, settings.CONTRACT_ADDRESS);

    const holder = selectWeightedPstHolder(contractState.balances)
     // send a fee. You should inform the user about this fee and amount.
    try {
        const tx = await arweave.createTransaction({ 
            target: holder, 
            quantity: transaction_cost * settings.USAGE_PERCENTAGE}
            , jwk);
            
        await arweave.transactions.sign(tx, jwk);
        await arweave.transactions.post(tx);
    } catch (e) {
        debugger;
        console.log(e);
    }
    
}


