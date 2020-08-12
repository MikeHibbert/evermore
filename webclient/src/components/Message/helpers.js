import arweave from '../../arweave-config';
import {decrypt_mail, wallet_to_key} from '../../helpers';
import {get_public_key, encrypt_mail} from './crypto';
import { toast } from 'react-toastify';


 const getMessages = async (beforeTimestamp=null) => {
    const address = sessionStorage.getItem('AR_Wallet', null);
    const jwk = JSON.parse(sessionStorage.getItem('AR_jwk', null));

    var oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    var afterTimestamp = Math.round(oneWeekAgo.getTime() / 1000);

    let get_mail_query =
    {
        op: 'and',
        expr1:
            {
                op: 'equals',
                expr1: 'to',
                expr2: address
            },
        expr2:
            {
                op: 'equals',
                expr1: 'App-Name',
                expr2: 'permamail'
            }
    }

    const tx_ids = await arweave.arql(get_mail_query)

    var tx_rows = []
    if (tx_ids.length > 0) {
        try {
            tx_rows = await populateMessageTransactions(tx_ids, jwk);
        } catch (e) {
            console.log(e)
        }
        
    }

    return tx_rows;
}

export const populateMessageTransactions = async (tx_ids, jwk) => {
    const tx_rows = await Promise.all(tx_ids.map(async (txid, i) => {
        
        let tx_row = {}
        
        var tx = await arweave.transactions.get(txid);
        
        tx_row['unixTime'] = '0';
        tx.get('tags').forEach(tag => {
            let key = tag.get('name', { decode: true, string: true });
            let value = tag.get('value', { decode: true, string: true });
            if (key === 'Unix-Time') tx_row['unixTime'] = value;
        })

        tx_row['id'] = txid
        tx_row['tx_status'] = await arweave.transactions.getStatus(txid)
        var from_address = await arweave.wallets.ownerToAddress(tx.owner)
        tx_row['from'] = await getName(from_address)
        tx_row['td_fee'] = arweave.ar.winstonToAr(tx.reward)
        tx_row['td_qty'] = arweave.ar.winstonToAr(tx.quantity)

        var mail = arweave.utils.bufferToString(await decrypt_mail(arweave.utils.b64UrlToBuffer(tx.data),await wallet_to_key(jwk)));
        try {
            mail = JSON.parse(mail);
        } catch (e) {} 

        // Upgrade old format.
        if (typeof mail === 'string') {
            mail = { 
                body: mail,
                subject: txid, 
            }
        }

        tx_row['mail'] = mail;

        // Validate 
        if (typeof mail !== 'object' || typeof mail.body !== 'string' || typeof mail.subject !== 'string') {
            console.error(mail);
            throw new Error(`Unexpected mail format: ${mail}`);
        }

        return tx_row
    }));

    return tx_rows;
}

export const getSentMessages = async () => {
    const address = sessionStorage.getItem('AR_Wallet', null);
    const jwk = JSON.parse(sessionStorage.getItem('AR_jwk', null));

    var oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    var afterTimestamp = Math.round(oneWeekAgo.getTime() / 1000);


    let get_mail_query =
    {
        op: 'and',
        expr1:
            {
                op: 'equals',
                expr1: 'from',
                expr2: address
            },
        expr2:
            {
                op: 'equals',
                expr1: 'App-Name',
                expr2: 'permamail'
            }
    }

    const tx_ids = await arweave.arql(get_mail_query)

    var tx_rows = []
    if (tx_ids.length > 0) {
        for(let i in tx_ids) {
            let tx_row = await populateSentMessageTransaction(tx_ids[i]);
            tx_rows.push(tx_row);
        }        
    }
    return tx_rows;
}

export const populateSentMessageTransaction = async (tx) => {
    let tx_row = {};

    await arweave.transactions.get(tx).then(async tx => {
        let timestamp = tx.get('tags')[2].get('value', { decode: true, string: true });

        tx_row = {
            "unixTime": timestamp,
            "id": tx.id,
            "to": tx.target,
        }
    });

    return tx_row;
}

export const sendMessage = async (message) => {
    const jwk = JSON.parse(sessionStorage.getItem('AR_jwk', null));
    var mailTagUnixTime = Math.round((new Date()).getTime() / 1000)

    var tokens = message.td_qty;
    if(tokens == '') {
        tokens = '0';
    }

    tokens = arweave.ar.arToWinston(tokens);

    var pub_key = await get_public_key(message.to);

    if(pub_key == undefined) {
        toast('Recipient has to send a transaction to the network, first!', { type: toast.TYPE.ERROR });
        return;
    }

    var content = await encrypt_mail(message.body, message.subject, pub_key);

    var tx =
        await arweave.createTransaction(
            {
                target: message.to,
                data: arweave.utils.concatBuffers([content]),
                quantity: tokens
            },
            jwk
        )

    tx.addTag('App-Name', 'permamail')
    tx.addTag('App-Version', '0.1.2')
    tx.addTag('Unix-Time', mailTagUnixTime)
    await arweave.transactions.sign(tx, jwk)

    await arweave.transactions.post(tx)
    toast('Mail dispatched!', { type: toast.TYPE.SUCCESS });

    tx['unixTime'] = Math.round(new Date().getTime() / 1000);
    
    addTransactionToPending(tx);

}

export const addTransactionToPending = (tx_id) => {
    let pending = localStorage.getItem('weavemail_pending_txs');

    if(!pending) {
        pending = JSON.stringify([tx_id]);
    } else {
        pending = JSON.parse(pending);
        pending.push(tx_id);
    }

    localStorage.setItem('weavemail_pending_txs', JSON.stringify(pending));
}

export const getPendingMessages = () => {
    let pending = JSON.parse(localStorage.getItem('weavemail_pending_txs'));

    if(!pending) {
        pending = [];
        localStorage.setItem('weavemail_pending_txs', JSON.stringify(pending));
    }

    return pending;
}

export const getName = async (addr) => {
	let get_name_query =
		{
			op: 'and',
			expr1:
				{
					op: 'equals',
					expr1: 'App-Name',
					expr2: 'arweave-id'
				},
			expr2:
				{
					op: 'and',
					expr1:
						{
							op: 'equals',
							expr1: 'from',
							expr2: addr
						},
					expr2:
						{
							op: 'equals',
							expr1: 'Type',
							expr2: 'name'
						}
				}
        }
        
	const txs = await arweave.api.post(`arql`, get_name_query)

	if(txs.data.length == 0)
		return addr

	const tx = await arweave.transactions.get((txs.data)[0])

	return tx.get('data', {decode: true, string: true})

}

export const checkPendingMessages = async () => {
    const jwk = JSON.parse(sessionStorage.getItem('AR_jwk', null));
    const pending_messages = JSON.parse(localStorage.getItem('weavemail_pending_messages'));
    const new_pending_messages = [];

    for(let i in pending_messages) {
        const pending_message = pending_messages[i];
        
        arweave.transactions.get(pending_messages.id).then(async tx => {
            const tags = tx.get('tags');

            const tx_row = {};
            tx_row['unixTime'] = '0'
            tx.get('tags').forEach(tag => {
                let key = tag.get('name', { decode: true, string: true })
                let value = tag.get('value', { decode: true, string: true })
                if (key === 'Unix-Time') tx_row['unixTime'] = value
            });

            tx_row['id'] = tx.id
            tx_row['tx_status'] = await arweave.transactions.getStatus(tx.id)
            var from_address = await arweave.wallets.ownerToAddress(tx.owner)
            tx_row['from'] = await getName(from_address)
            tx_row['td_fee'] = arweave.ar.winstonToAr(tx.reward)
            tx_row['td_qty'] = arweave.ar.winstonToAr(tx.quantity)

            var mail = arweave.utils.bufferToString(await decrypt_mail(arweave.utils.b64UrlToBuffer(tx.data),await wallet_to_key(jwk)));
            try {
                mail = JSON.parse(mail);
            } catch (e) {} 

            // Upgrade old format.
            if (typeof mail === 'string') {
                mail = { 
                    body: mail,
                    subject: tx.id, 
                }
            }

            tx_row['mail'] = mail;

            // Validate 
            if (typeof mail !== 'object' || typeof mail.body !== 'string' || typeof mail.subject !== 'string') {
                console.error(mail);
                throw new Error(`Unexpected mail format: ${mail}`);
            }

            
        }).catch(error => {
            if(error.type == "TX_PENDING") {
                new_pending_messages.push(pending_message);
            }
        }).finally(() => {
            localStorage.setItem('weavemail_pending_messages', JSON.stringify(new_pending_messages));
        });
    }
}

export const addToPending = (message) => {
    const pending_messages = JSON.parse(localStorage.getItem('weavemail_pending_messages'));

    pending_messages.push(message);

    localStorage.setItem('weavemail_pending_messages', JSON.stringify(pending_messages));
}


export default getMessages;