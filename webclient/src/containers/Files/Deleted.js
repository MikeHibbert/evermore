import React, {Component} from 'react';
import FolderTableRow from '../../components/Files/FolderTableRow';
import DeletedFileTableRow from '../../components/Files/DeletedFileTableRow';
import settings from '../../app-config';
import arweave from '../../arweave-config';
import {SaveUploader, RemoveUploader, convertPersistenceRecordsToDeletedFileInfos} from './helpers';


const UploaderProgressBar = (props) => {
    return (
        <div id="clipboard_4" className="mb-3">
            <div className="progress mb-3">
                <div className="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style={{width: props.percent + "%"}} ></div>
            </div>
        </div>
    )
} 


class DeletedView extends Component {
    state = {
        folder_name: "",
        paths: null,
        optionsStyle: null,
        optionsClasses: "dropdown-menu",
        uploadPercentComplete: 0,
        uploadingFile: false
    }

    constructor(props) {
        super(props);

        this.onSelectFolder.bind(this);
        this.onToggleOptions.bind(this);
    }

    onSelectFolder(folder_name) {
        this.setState({folder_name: folder_name});
    }

    onUploadFile(e) {
        const filename = e.target.files[0]

        const that = this;
        const reader = new FileReader();
        reader.onload = async function() {
            const file_data = new Uint8Array(reader.result)

            let transaction = await arweave.createTransaction({
                data: file_data
            }, that.props.jwk);

            transaction.addTag('App', settings.APP_NAME);
            transaction.addTag('file', filename.name.replace(/([^:])(\/\/+)/g, '$1/'));
            transaction.addTag('path', filename.name.replace(/([^:])(\/\/+)/g, '$1/'));
            transaction.addTag('modified', filename.lastModifiedDate.getDate());          
            transaction.addTag('hostname', window.location.hostname);
            transaction.addTag('version', 1);

            await arweave.transactions.sign(transaction, that.props.jwk);
            
            let uploader = await arweave.transactions.getUploader(transaction);

            
            SaveUploader(uploader);    

            that.setState({uploadingFile:true});

            while (!uploader.isComplete) {
                await uploader.uploadChunk();

                that.setState({uploadPercentComplete: uploader.pctComplete})
                console.log(`${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`);
            }

            RemoveUploader(uploader);
            
        }
        reader.readAsArrayBuffer(filename);
    }

    createRows(file_info, file_rows, folder_rows) {
        if(this.state.folder_name == file_info.name) {
            
            if(file_info.children.length > 0) {
                for(let i in file_info.children) {
                    const path = file_info.children[i];
                    
                    if(path.type == "folder") {
                        folder_rows.push(
                            <FolderTableRow file_info={path} onSelectFolder={e => { this.onSelectFolder(e) }} key={i} />
                        );
                    } else {
                        file_rows.push(
                            <DeletedFileTableRow file_info={path} key={i} wallet_jwk={this.props.jwk}/>
                        );
                    }
                }   
            }
        } else {
            for(let i in file_info.children) {
                const path = file_info.children[i];
                this.createRows(path, file_rows, folder_rows);
            }
        }
    }

    onToggleOptions() {
        if(!this.state.optionsStyle) {
            this.setState({optionsStyle: {
                position: "absolute",
                transform: "translate3d(82px, 52px, 0px)",
                top: "0px",
                left: "0px",
                willChange: "transform"
            }, optionsClasses: "dropdown-menu show"});
        } else {
            this.setState({optionsStyle: null, optionsClasses: "dropdown-menu"});
        }


    }

    openFileDialog(e) {
        e.preventDefault();

        this.refs.filename.click();
    }

    render() {
        const file_rows = [];
        const folder_rows = [];

        if(this.props.persistence_records != null) {
            const deleted_files = convertPersistenceRecordsToDeletedFileInfos(this.props.persistence_records);
            
            this.createRows(deleted_files[''], file_rows, folder_rows);
        }

        
        // style="position: absolute; transform: translate3d(82px, 52px, 0px); top: 0px; left: 0px; will-change: transform;"
        // const file_rows = this.state.paths.map(file => {
        //     return <FileTableRow file_info={file} key={file.id} />;
        // }) 

        let uploaderBar = null;
        if(this.state.uploadingFile) {
            uploaderBar = <UploaderProgressBar percent={this.state.uploadPercentComplete} />;
        }
        return (
            <div className="row gutters-sm">

						<div className="col-12 mb-3">


							<div className="portlet">

								<div className="portlet-header border-bottom">
									<span>Deleted Files</span>
								</div>

								<div className="portlet-body">
                                    {uploaderBar}
                                    
                                    
                                        <input style={{display: "none"}} ref="filename" type="file" name="uploader"></input>
                                    
									<div className="container py-6">
                                        <div className="pull-right" style={{marginBottom: "10px"}}>
                                            <div className="btn-group">
                                                <button type="button" onClick={e => {this.onToggleOptions()}} className="btn btn-primary">Actions</button>
                                                <button type="button" onClick={e => {this.onToggleOptions()}} className="btn btn-primary dropdown-toggle dropdown-toggle-split" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                                    <span className="sr-only">Toggle Dropdown</span>
                                                    <span className="group-icon m-0">
                                                        <i className="fi fi-arrow-down"></i>
                                                        <i className="fi fi-arrow-up"></i>
                                                    </span>
                                                </button>
                                                <div className={this.state.optionsClasses}  x-placement="bottom-start">
                                                    <h6 className="dropdown-header"></h6>
                                                    <a className="dropdown-item active" onClick={(e) => this.openFileDialog(e)} href="#">
                                                        <i className="fa fa-upload" aria-hidden="true"></i>
                                                        Upload to this folder
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
											<div className="table-responsive">
												<table className="table table-framed">
													<thead>
														<tr>
															<th className="text-gray-500 font-weight-normal fs--14 min-w-300">FILE NAME</th>
															<th className="text-gray-500 font-weight-normal fs--14 w--100 text-center">LAST MODIFIED</th>
                                                            <th className="text-gray-500 font-weight-normal fs--14 w--60 text-align-end">&nbsp;</th>
														</tr>
													</thead>

													<tbody id="item_list">
                                                        {folder_rows}
														{file_rows}
													</tbody>

													<tfoot>
														<tr>
                                                            <th className="text-gray-500 font-weight-normal fs--14 min-w-300">FILE NAME</th>
															<th className="text-gray-500 font-weight-normal fs--14 w--100 text-center">LAST MODIFIED</th>
                                                            <th className="text-gray-500 font-weight-normal fs--14 w--60 text-align-end">&nbsp;</th>
														</tr>   
													</tfoot>

												</table>
											</div>

                                            

									</div>
								</div>

							</div>

						</div>

					</div>
        )
    }
}

export default DeletedView;