import React, { useEffect, useState, memo } from 'react';
import DropdownMenu from '../../components/forms/DropdownMenu';
import { combinableNFT } from './helpers';
import { getNFTFileInfos } from '../Files/helpers';
import NFTCombineControl from './NFTCombineControl';
const dJSON = require('dirty-json');

const MergeNFT = memo(props =>  {
    const [nfts, setNFTs] = useState([]);
    const [selection_one, setSelectionOne] = useState({url: null});
    const [further_selections, setFurtherSelections] = useState([]);
    const [loading_base, setLoadingBase] = useState(true);

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
            setLoadingBase(false);
        })();

    }, [])

    function setMainSelection(nft) {
        nft['url'] = `https://arweave.net/${nft.value}`;
        setSelectionOne(nft);

        const img = document.createElement('img');
        img.src = `https://arweave.net/${nft.value}`;

        img.onload = function() {
            const c = document.getElementById('Combined');
            c.width = img.width;
            c.height = img.height;
            const ctx = c.getContext("2d");
            ctx.drawImage(img, 0, 0);
        }
        
    }

    function addFurtherSelection() {
        const index = further_selections.length;
        const new_further_selections = [
            {index: index, name: "Select NFT To Combine", value:""},
            ...further_selections
        ];

        setFurtherSelections(new_further_selections);
    }

    function dropdownList() {
        let options = [...nfts];

    }

    let selection_one_options = [];
    if(nfts) {

        selection_one_options = nfts.map(nft => {
            return {value: nft.id, name: nft['Init-State'].name};
        })

    }

    let base_nft_canvas = <img id="BaseNFT" className="img-fluid" src={selection_one.url} />;
    let base_first_selection_name = "Select Base NFT";
    if(loading_base) {
        base_nft_canvas = <img style={{ height: '200px' }} src="images/spinner-dark.svg" />;
        base_first_selection_name = "Loading NFTs...";
    } 

    const selection_one_dropdown = <DropdownMenu items={selection_one_options} onClickSelection={(nft) => setMainSelection(nft)} first_selection={{name: base_first_selection_name, value: ""}} />;


    let combine_options = further_selections.map(selection => {
        const key = `combine-control-${selection.index}`;
        return <NFTCombineControl key={key} selection={selection} items={selection_one_options} />;
    });

    // console.log('Render MergeNFT')
    return(
        <div className="row gutters-sm">

            <div className="col-12 mb-3">
                <div className="portlet">

                    <div className="portlet-header border-bottom">
                        <span>Combine NFTs</span>
                    </div>

                    <div className="portlet-body">
                        <div className="mt-3 mb-3">
                            <div className="mb-3 col-6">  
                                {selection_one_dropdown}
                            </div>
                            <div className="mb-3 col-6">
                                {base_nft_canvas}
                                <hr/>
                            </div>
                            <div className="mb-3 col-6">
                                <button className="btn btn-success" onClick={() => addFurtherSelection()}><i className="fa fa-plus"></i> Add NFT to combine</button>
                            </div>
                            {combine_options}
                            
                            <div className="col-6">
                                <hr/>
                                <p>Resulting NFT</p>
                                <canvas className="img-fluid" id="Combined">
                                </canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    );

});

export default MergeNFT;