import React, { Component } from 'react';

export default class MergeNFT extends Component {

    dropdownList() {
        let options = this.state.nfts;

    }
    render() {
        return(
            <>
                <div style={{display: "inline-grid"}}>
                    <div style={{backgroundColor: "#002955", display: 'inline-block', borderRadius: "20px", marginBottom: "10px"}}>
                        <canvas style={{padding: "20px"}}>
                            <img /*src={this.state.nft_1}*//>
                        </canvas>
                    </div>
                    <div class="dropdown">
                        <button onClick={() => {this.dropdownList()}} class="dropbtn">Dropdown</button>
                        
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