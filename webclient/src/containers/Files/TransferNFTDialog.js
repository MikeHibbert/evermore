import { render } from '@testing-library/react';
import React from 'react';
import { Component } from 'react';
import { removePathInfosWithChecked } from '../../fsHandling/helpers';
import { addFolderInfoToPathInfos } from './helpers';

class TransferNFTDialog extends Component {
    state = {
        target: "",
        targetClasses: "form-control",
        confirmed: false,
        confirmedClasses: "form-check-input"
    }

    constructor(props) {
        super(props);
        this.closeDialog.bind(this);
        this.transferNFT.bind(this);
    }

    componentDidMount() {
        document.body.classList.add('modal-open'); 
        document.getElementById('modal-backdrop').classList.add('modal-backdrop');
        document.getElementById('modal-backdrop').classList.add('fade');
        document.getElementById('modal-backdrop').classList.add('show');
    }

    closeDialog() {
        document.body.classList.remove('modal-open'); 
        document.getElementById('modal-backdrop').classList.remove('modal-backdrop');
        document.getElementById('modal-backdrop').classList.remove('fade');
        document.getElementById('modal-backdrop').classList.remove('show');
        this.props.closeTransferDialog();
    }

    transferNFT() {
        let form_elements_valid = 0;
        const element_classes = {};

        if(this.state.target.length > 0) {
            form_elements_valid += 1;
        } else {
            element_classes['targetClasses'] = "form-control is-invalid";
        }

        if(this.state.confirmed) {
            form_elements_valid += 1;
        } else {
            element_classes['confirmedClasses'] = "form-check-input is-invalid";
        }

        if(form_elements_valid == 2) {
            debugger;
            this.closeDialog();
            this.props.transferNFT(this.state.target);            
        } else {
            this.setState(element_classes);
        }   
    }

    OnChange(e) {
        const value = e.target.value;
        const item = e.target.name;

        const state = {...this.state};

        state[item] = value;
        this.setState(state);
    }

    render() {
        return (<div className="modal fade show" id="exampleModalMd" tabIndex="-1" aria-labelledby="exampleModalLabelMd" style={{"display": "block", "paddingRight": "17px"}} aria-modal="true" role="dialog">
                    <div className="modal-dialog" role="document">
                        <div className="modal-content">
                            
                            <div className="modal-header">
                                <h5 className="modal-title" id="exampleModalLabelMd">Transfer Ownership</h5>
                                <button type="button" className="close" data-dismiss="modal" aria-label="Close" onClick={() => { this.closeDialog(); }}>
                                    <span className="fi fi-close fs--18" aria-hidden="true"></span>
                                </button>
                            </div>

                            <div className="modal-body">
                                <p>Please provide a valid Arweave Wallet address for the new owner of this NFT</p>
                                <div className="form-label-group mb-3">
                                    <input onChange={(e) => { this.OnChange(e) }} placeholder="Name" name='target' className={this.state.targetClasses} value={this.state.target} />
                                    <label htmlFor="name">Wallet Address</label>
                                </div>  
                                <div className="form-group form-check">
                                    <input type="checkbox" className={this.state.confirmedClasses} name='confirmed' onChange={(e) => { this.OnChange(e) }} />
                                    <label className="form-check-label" htmlFor="confirmed">I agree to the transfer of ownership of this NFT</label>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-primary" onClick={() => { this.transferNFT(); }}>
                                    <i className="fa fa-upload"></i> 
                                    Transfer Ownership
                                </button>
                                <button type="button" className="btn btn-secondary" data-dismiss="modal" onClick={() => { this.closeDialog(); }}>
                                    <i className="fi fi-close"></i> 
                                    Close
                                </button>
                            </div>

                        </div>
                    </div>
                </div>);
    }
};

export default TransferNFTDialog;
