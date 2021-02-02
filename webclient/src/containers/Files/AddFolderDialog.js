import { render } from '@testing-library/react';
import React from 'react';
import { Component } from 'react';
import { addFolderInfoToPathInfos } from './helpers';

class AddFolderDialog extends Component {
    state = {
        folder_name: ""
    }

    constructor(props) {
        super(props);
        this.closeDialog.bind(this);
        this.createSubFolder.bind(this);
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

    createSubFolder() {
        addFolderInfoToPathInfos(this.state.folder_name, this.props.previous_folders, 0, this.props.files[""]);
        this.closeDialog();
    }

    OnChange(e) {
        const folder_name = e.target.value;
        this.setState({folder_name: folder_name});
    }

    render() {
        return (<div className="modal fade show" id="exampleModalMd" tabIndex="-1" aria-labelledby="exampleModalLabelMd" style={{"display": "block", "paddingRight": "17px"}} aria-modal="true" role="dialog">
                    <div className="modal-dialog" role="document">
                        <div className="modal-content">
                            
                            <div className="modal-header">
                                <h5 className="modal-title" id="exampleModalLabelMd">Add subfolder to {}</h5>
                                <button type="button" className="close" data-dismiss="modal" aria-label="Close" onClick={() => { this.closeDialog(); }}>
                                    <span className="fi fi-close fs--18" aria-hidden="true"></span>
                                </button>
                            </div>

                            <div className="modal-body">
                                <input onChange={(e) => { this.OnChange(e) }} className="form-control" value={this.state.folder_name} />
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-primary" onClick={() => { this.createSubFolder(); }}>
                                    <i className="fi fi-check"></i> 
                                    Create subfolder
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

export default AddFolderDialog;
