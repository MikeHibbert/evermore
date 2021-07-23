import React, { Component } from 'react';
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
        let selection_one_options = null;
        if(this.state.nfts) {
            let further_selections = [...this.state.nfts];
            debugger;
            selection_one_options = this.state.nfts.map(nft => {
                return <option value={nft.id}>{nft['Init-State'].name}</option>;
            })
        }

        return(
            <>
                <div style={{display: "inline-grid"}}>
                    <div style={{backgroundColor: "#002955", display: 'inline-block', borderRadius: "20px", marginBottom: "10px"}}>
                        <canvas style={{padding: "20px"}}>
                            <img /*src={this.state.nft_1}*//>
                        </canvas>
                    </div>
                    <div class="dropdown">
                        <form>
                        <select className='form-control' onClick={() => {this.dropdownList()}} class="dropbtn">
                            {selection_one_options}
                        </select>
                        </form>
                    </div>
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