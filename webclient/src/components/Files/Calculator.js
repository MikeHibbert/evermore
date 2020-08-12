import React, {Component} from 'react';
import axios from 'axios';
import arweave from '../../arweave-config';
import { format } from "d3-format";

const valueToBytesUsingScale = (value, scale) => {
    let ret_val = 0;

    switch(scale) {
        case "GB":
            ret_val = Math.floor(parseFloat(value) * 1000000000);
            break;
        case "MB":
            ret_val = Math.floor(parseFloat(value) * 1000000);
            break;
        case "KB":
            ret_val = Math.floor(parseFloat(value));
            break;
    }

    return ret_val;
}

class CostCalculator extends Component {
    state = {
        current_price: 0,
        scale: "GB",
        cost: 0,
        ar_cost: 0
    }

    componentWillMount() {
        const bilaxy_url = "https://api.bilaxy.com/v1/ticker?symbol=297";

        const that = this;
        axios.get(bilaxy_url).then(res => {
            that.setState({current_price: parseFloat(res.data.data.last)});
        })
    }

    onGetPrice(e) {
        const data_size = e.target.value != "" ? e.target.value.trim():0;

        const size = valueToBytesUsingScale(data_size, this.state.scale);

        const that = this;
        arweave.transactions.getPrice(size).then(price => {
            const ar = parseFloat(arweave.ar.winstonToAr(price));
            const cost = ar * that.state.current_price;

            that.setState({cost: cost + (cost * 0.2), ar_cost:ar + (ar * 0.2)});
        })

    }

    onSetDataScale(e) {
        const scale = e.target.value;

        this.setState({scale: scale})
    }

    render() {
        
        return(<>
            <ul className="cd-pricing-list cd-bounce-invert">
            <li className="d-inline-block text-center">
                <ul className="cd-pricing-wrapper cd-pricing-body">
                    
                    </ul>
                <ul className="cd-pricing-wrapper cd-pricing-body">
                    <li data-type="monthly" className="is-visible">
                         <div className="price-deck text-center">
                             <div className=" three-d-site">
                                <div className="pricing-main main-vh-four">		        
                                    <div className="price-body">
                                        <div className="price-body-title">
                                            <h3>Data cost calculator</h3>
                                        </div> 
                                        <div className="pricing-value">	    
                                        <small className="small-one title-inner">
                                        <select className="form-control mt-5" onChange={(e) => {this.onSetDataScale(e)}}>
                                            <option value="GB">GB</option>
                                            <option value="MB">MB</option>
                                            <option value="KB">KB</option>
                                        </select>  
                                        </small>
                                        </div>           
                                    </div>	            
                                    <ul>
                                      <li><input className="form-control col-10 m-4" name="size" onChange={(e) => {this.onGetPrice(e)}} placeholder="Enter data size" /></li>
                                    </ul>
                                    <div className="pricing-price pb-30">
                                        <small>$</small><h3>{format('.2f')(this.state.cost)} </h3>
                                    </div>    
                                    <div className="pricing-price pb-30">
                                        <h3>{format('.8f')(this.state.ar_cost)} </h3>  <small> AR</small>
                                    </div>         
                                </div>
                            </div>  
                         </div>
                    </li>
                    
                </ul> 
                
                <ul className="cd-pricing-wrapper cd-pricing-body">
                
                </ul>
            </li>
        </ul>
        </>
        )
    }
}

export default CostCalculator;