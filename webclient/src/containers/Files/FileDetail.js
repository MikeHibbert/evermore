import React, {Component} from 'react';
import Arweave from 'arweave/web';
import { readContract, interactWrite  } from 'smartweave';
import TransferNFTDialog from './TransferNFTDialog';
import { Link } from 'react-router-dom';
import {escapeText} from './helpers';

const arweave = Arweave.init({
    host: 'arweave.net',// Hostname or IP address for a Arweave host
    port: 443,          // Port
    protocol: 'https',  // Network protocol http or https
    timeout: 20000,     // Network request timeouts in milliseconds
    logging: false,     // Enable network request logging
});

class FileDetail extends Component {
    state = {
        txid: null,
        file_info: null,
        transferDialogOpen: false
    }

    getFileInfo(file_info, txid) {
        if(file_info.type == 'folder') {
            for(let i in file_info.children) {
                const fi = file_info.children[i];
                if(fi.type == 'folder') {
                    const match = this.getFileInfo(fi, txid);
                    if(match) {
                        return match;
                    }
                } else {
                    if(fi.id == txid) {
                        return fi;
                    }
                }
                
            }
        } else {
            if(file_info.id == txid) {
                return file_info;
            }
        }
    }

    openTransferDialog() {
        this.setState({transferDialogOpen: true});
    }

    closeTransferDialog() {
        this.setState({transferDialogOpen: false});
    }

    async transferNFT(title, contractTXID, target) {
        debugger;
        const response_id = await interactWrite(arweave, this.props.jwk, contractTXID, 
            {
                function: 'transfer', 
                target: target, 
                qty: 1
            },
            [
                    {name: "Application", value: "Evermore" },
                    {name: "Action", value: "Transfer" },
                    {name: "target", value: target}
            ]
        );

        let submitted_txs = JSON.parse(sessionStorage.getItem('evermore-files-to-be-mined'));

        if(!submitted_txs) submitted_txs = [];

        submitted_txs.push({
            id: response_id,
            name: `Transfer of ${title}`
        });
        sessionStorage.setItem('evermore-files-to-be-mined', JSON.stringify(submitted_txs));

        this.closeTransferDialog();
        this.props.addSuccessAlert("The transfer process has begun. Please allow at least 15mins for the transfer to be mined.");

        this.props.history.push("/files");
    }

    render() {
        const content_element = <a href=''></a>;
        const txid = this.props.location.pathname.split('/')[2];

        let tx_detail = <img style={{height: '320px'}} src="images/spinner-dark.svg" />;
        let transfer_dialog = null;

        if(this.props.files && txid) {
            const file_info = this.getFileInfo(this.props.files[''], txid);

            const nft_state = JSON.parse(file_info['Init-State']);

            const embed_url = `https://arweave.net/${txid}`;

            tx_detail = <>
                <div className="portlet-header border-bottom">
                    <span>File Details</span>
                    </div>

                    <div className="portlet-body">                            
                        <div className="container py-6">
                        <div className='row'><Link to='/files'>&lt;&lt; BACK</Link></div>
                        <div className="row  align-items-center no-gutters">
                            <div className="col-12 col-md-6 col-lg-5 col-xl-4 z-index-1"></div>
                            <div className="card b-0 shadow-xs transition-hover-top transition-all-ease-500 rounded-xl mt-4 mb-4">

                                <div className="bg-light rounded-xl rounded-bottom-0 pt-3 pb-3">

                                    <h3 className="text-center">
                                        <span className="fs--13 badge badge-secondary badge-pill badge-soft font-weight-light pl-2 pr-2 pt--6 pb--6">
                                            {nft_state.ticker}
                                        </span>
                                    </h3>

                                    <div className="d-flex justify-content-center">
                                        <span className="mb-0 display-6 font-weight-normal">{nft_state.name}</span>
                                    </div>

                                </div>

                                <div className="w-100 h--1 position-relative">
                                    <svg className="mt--n70" width="100%" height="50" fill="#ffffff" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 300" preserveAspectRatio="none">
                                        <path style={{'opacity':'0.15'}} d="M 1000 299 l 2 -279 c -155 -36 -310 135 -415 164 c -102.64 28.35 -149 -32 -232 -31 c -80 1 -142 53 -229 80 c -65.54 20.34 -101 15 -126 11.61 v 54.39 z"></path>
                                        <path style={{"opacity":"0.3"}} d="M 1000 286 l 2 -252 c -157 -43 -302 144 -405 178 c -101.11 33.38 -159 -47 -242 -46 c -80 1 -145.09 54.07 -229 87 c -65.21 25.59 -104.07 16.72 -126 10.61 v 22.39 z"></path>
                                        <path style={{"opacity":"1"}} d="M 1000 300 l 1 -230.29 c -217 -12.71 -300.47 129.15 -404 156.29 c -103 27 -174 -30 -257 -29 c -80 1 -130.09 37.07 -214 70 c -61.23 24 -108 15.61 -126 10.61 v 22.39 z"></path>
                                    </svg>
                                </div>

                                <div className="p--20 pb--40">

                                    <div className="d-flex mb-3">

                                        <p className="text-dark font-weight-light mb-0 pl--12 pr--12">
                                            {nft_state.description}
                                        </p>

                                    </div>


                                    <div className="d-flex mb-3">

                                        <p className="text-dark font-weight-light mb-0 pl--12 pr--12">
                                            <a href={embed_url} target='_blank'>View on the blockchain</a>
                                        </p>

                                    </div>
                                </div>


                                <a onClick={(e) => {this.openTransferDialog()}} className="card-btn btn btn-block btn-lg btn-primary btn-soft btn-noshadow rounded-xl rounded-top-0">
                                    Transfer ownership
                                </a>

                                </div>
                                    

                            </div>
                        </div>
                    </div>
                
            </>;


            if(this.state.transferDialogOpen) {
                debugger;
                transfer_dialog = <TransferNFTDialog 
                                    closeTransferDialog={() => { this.closeTransferDialog() }}
                                    transferNFT={(target) => { this.transferNFT(file_info.name, file_info.id, target)}}
                                />;
            }
        }

        

        
        return (
            <div className="row gutters-sm">

                <div className="col-12 mb-3">


                    <div className="portlet">
                        {transfer_dialog}
                        {tx_detail}

                        
                    </div>

                </div>

            </div>
        )
    }
}

export default FileDetail;