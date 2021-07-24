import React, { Component, useEffect, useState } from 'react';
import DropdownMenu from '../../components/forms/DropdownMenu';
import { combinableNFT } from './helpers';
import { getNFTFileInfos } from '../Files/helpers';
const dJSON = require('dirty-json');

export default function MergeNFT(props)  {
    const [nfts, setNFTs] = useState([]);
    const [selection_one, setSelectionOne] = useState(null);
    const [further_selections, setFurtherSelections] = useState([]);
    const [loading_base, setLoadingBase] = useState(false);

    useEffect(() => {(
        async () => {
            const nft_infos = await getNFTFileInfos(props.wallet_address);
            const nfts = nft_infos[''].children[0].children;

            const qualifying_nfts = [];
            for(let i in nfts) {
                if(combinableNFT(nfts[i])) {
                    const nft = {...nfts[i]};
                    nft['Init-State'] = dJSON.parse(nft['Init-State']);
                    qualifying_nfts.push(nft);
                }
            }

            if(qualifying_nfts.length > 0) setNFTs(qualifying_nfts);
        })();

    }, [])

    function setMainSelection(nft) {
        setSelectionOne(nft);

        const img = document.createElement('img');
        img.src = `https://arweave.net/${nft.value}`;
        setLoadingBase(true);
        img.onload = function() {
            setLoadingBase(false);
            const c = document.getElementById('baseNFT');
            c.width = img.width;
            c.height = img.height;
            const ctx = c.getContext("2d");
            ctx.drawImage(img, 0, 0);
        }
        
    }

    function dropdownList() {
        let options = [...nfts];

    }

    let selection_one_options = [];
    if(nfts) {
        let further_selections = [...nfts];

        selection_one_options = nfts.map(nft => {
            return {value: nft.id, name: nft['Init-State'].name};
        })

    }

    let base_nft_canvas = <canvas id="baseNFT" ></canvas>
    if(loading_base) {
        base_nft_canvas = <img style={{ height: '200px' }} src="images/spinner-dark.svg" />;
    } 

    const selection_one_dropdown = <DropdownMenu items={selection_one_options} onClickSelection={(nft) => setMainSelection(nft)} first_selection={{name: "Select Base NFT", value: ""}} />;

    return(
        <div className="row gutters-sm">

            <div className="col-12 mb-3">
                <div className="portlet">

                    <div className="portlet-header border-bottom">
                        <span>Combine NFTs</span>
                    </div>

                    <div className="portlet-body">
                        <div className="mt-3 mb-3">
                                {selection_one_dropdown}
                            </div>
                            <div className="mb-3">
                                {base_nft_canvas}
                            </div>
                            
                            <div style={{backgroundColor: "#002955", display: 'inline-block', borderRadius: "20px"}}>
                                <canvas style={{padding: "20px"}}>
                                    <img /*src={this.state.nft_2}*//>
                                </canvas>
                            </div>
                        </div>
                    </div>
            </div>
        </div>

    );

}