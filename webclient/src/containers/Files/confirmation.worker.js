const axios = require('axios');
const { toast } = require('react-toastify');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function confirmTransactionMinedStatus(e) {
    const file_info = e[0];

    let confirmed = false;

    while(!confirmed) {
        const response = await axios.get(`https://arweave.net/tx/${file_info.tx_id}/status`);

        if(response.status == 200) {
            if(response.data.number_of_confirmations > 4) {
                toast(`${file_info.name} has been successfully mined`);
                if(file_info.is_nft) {
                    console.log('updating Verto Cache with new tx');
                    await axios.get(`https://v2.cache.verto.exchange/fetch/${file_info.tx_id}`);
                    confirmed = true;
                    
                }
            }
        }
        console.log('confirmTransactionMinedStatus -> sleep(60000);')
        await sleep(60000);
    }

    this.terminate();
}