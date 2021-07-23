import React, { Component } from 'react';
import DropdownMenu from '../../components/forms/DropdownMenu';
import { combinableNFT } from './helpers';
const dJSON = require('dirty-json');

export default class MergeNFT extends Component {
    state = {
        nfts: null,
        selection_one: null,
        further_selections: []
    }

    componentDidMount() {
        const nfts = this.props.files[''].children.filter(item => item.type=='folder' && item.name=='NFTs')[0].children;
        const qualifying_nfts = [];
        for(let i in nfts) {
            if(combinableNFT(nfts[i])) {
                const nft = {...nfts[i]};
                nft['Init-State'] = dJSON.parse(nft['Init-State']);
                qualifying_nfts.push(nft);
            }
        }

        this.setState({nfts: qualifying_nfts});
    }

    dropdownList() {
        let options = this.state.nfts;

    }
    render() {
        let selection_one_options = [];
        if(this.state.nfts) {
            let further_selections = [...this.state.nfts];

            selection_one_options = this.state.nfts.map(nft => {
                return {value: nft.id, name: nft['Init-State'].name};
            })

        }

        const selection_one_dropdown = <DropdownMenu items={selection_one_options} />;

        return(
            <>
                <div style={{display: "inline-grid"}}>
                    <div style={{backgroundColor: "#002955", display: 'inline-block', borderRadius: "20px", marginBottom: "10px"}}>
                        <canvas style={{padding: "20px"}}>
                            <img /*src={this.state.nft_1}*//>
                        </canvas>
                    </div>
                    {selection_one_dropdown}
                    <div style={{backgroundColor: "#002955", display: 'inline-block', borderRadius: "20px"}}>
                        <canvas style={{padding: "20px"}}>
                            <img /*src={this.state.nft_2}*//>
                        </canvas>
                    </div>
                </div>
            </>
        );
    }
}