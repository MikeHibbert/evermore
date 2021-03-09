import { render } from '@testing-library/react';
import React from 'react';
import { Component } from 'react';
import { removePathInfosWithChecked } from '../../fsHandling/helpers';
import { addFolderInfoToPathInfos } from './helpers';

class AddNFTDialog extends Component {
    state = {
        name: "",
        description: "",
        nameClasses: "form-control",
        descriptionClasses: "form-control"
    }

    constructor(props) {
        super(props);
        this.closeDialog.bind(this);
        this.uploadNFT.bind(this);
        this.onUploadFileHandler.bind(this);
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
        this.props.hideFolderDialog();
    }

    uploadNFT() {
        let form_elements_valid = 0;
        const element_classes = {};

        if(this.state.name.length > 0) {
            form_elements_valid += 1;
        } else {
            element_classes['nameClasses'] = "form-control is-invalid";
        }

        if(this.state.description.length > 0) {
            form_elements_valid += 1;
        } else {
            element_classes['descriptionClasses'] = "form-control is-invalid";
        }

        if(form_elements_valid == 2) {
            this.refs.nft_filename.click();
            
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

    onUploadFileHandler(e) {
        e['nftName'] = this.state.name;
        e['nftDescription'] = this.state.description;

        debugger;

        this.closeDialog();

        this.props.onUploadFileHandler(e);        
    }

    render() {
        return (<div className="modal fade show" id="exampleModalMd" tabIndex="-1" aria-labelledby="exampleModalLabelMd" style={{"display": "block", "paddingRight": "17px"}} aria-modal="true" role="dialog">
                    <div className="modal-dialog" role="document">
                        <div className="modal-content">
                            
                            <div className="modal-header">
                                <h5 className="modal-title" id="exampleModalLabelMd">Create New NFT</h5>
                                <button type="button" className="close" data-dismiss="modal" aria-label="Close" onClick={() => { this.closeDialog(); }}>
                                    <span className="fi fi-close fs--18" aria-hidden="true"></span>
                                </button>
                            </div>

                            <div className="modal-body">
                                <p>Please provide a name and description for your new NFT</p>
                                <div className="form-label-group mb-3">
                                    <input onChange={(e) => { this.OnChange(e) }} placeholder="Name" name='name' className={this.state.nameClasses} value={this.state.name} />
                                    <label htmlFor="name">Name</label>
                                </div>
                                <div className="form-label-group mb-3">
                                    <textarea 
                                        className={this.state.descriptionClasses} 
                                        value={this.state.description}
                                        placeholder="Description" name='description' onChange={(e) => { this.OnChange(e) }}></textarea>
                                    <label htmlFor="description">Description</label>
                                </div>

                                <input style={{display: "none"}} ref="nft_filename" type="file" name="nft-uploader" onChange={(e) => { this.onUploadFileHandler(e)}}></input>
                                    
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-primary" onClick={() => { this.uploadNFT(); }}>
                                    <i className="fa fa-upload"></i> 
                                    Select file to upload
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

export default AddNFTDialog;
