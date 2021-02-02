import React, {Component} from 'react';
import FileTableRow from '../../components/Files/FileTableRow';
import FolderTableRow from '../../components/Files/FolderTableRow';
import settings from '../../app-config';
import arweave from '../../arweave-config';
import {SaveUploader, RemoveUploader, addFolderInfoToPathInfos} from './helpers';
import { Link } from 'react-router-dom';
import AddFolderDialog from './AddFolderDialog';


const UploaderProgressBar = (props) => {
    return (
        <div id="clipboard_4" className="mb-3">
            <div className="progress mb-3">
                <div className="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style={{width: props.percent + "%"}} ></div>
            </div>
        </div>
    )
} 

const DownloaderProgressBar = (props) => {
    const css_classes = props.decrypting ? "progress-bar progress-bar-striped progress-bar-animated": "progress-bar progress-bar-striped progress-bar-animated decrypting";
    return (
        <div id="clipboard_4" className="mb-3">
            <div className="progress mb-3">
                <div className={css_classes} role="progressbar" style={{width: props.percent + "%"}} ></div>
            </div>
        </div>
    )
} 


class FoldersView extends Component {
    state = {
        folder_name: "",
        previous_folders: [],
        paths: null,
        optionsStyle: null,
        optionsClasses: "dropdown-menu",
        uploadPercentComplete: 0,
        uploadingFile: false,
        subfolder_dialog: false
    }

    constructor(props) {
        super(props);

        this.onSelectFolder.bind(this);
        this.onToggleOptions.bind(this);
        this.goBack.bind(this);
        this.hideFolderDialog.bind(this);
    }

    onSelectFolder(folder_name) {
        const previous_folders = [...this.state.previous_folders];
        previous_folders.push(this.state.folder_name);
        this.setState({folder_name: folder_name, previous_folders: previous_folders});
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
                            <FileTableRow file_info={path} key={i} downloadFile={(e) => {this.download(e, file_info)}} />
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

        this.setState({optionsStyle: null, optionsClasses: "dropdown-menu"});

        this.refs.filename.click();
    }

    openSubFolderDialog(e) {
        e.preventDefault();

        debugger;

        this.setState({optionsStyle: null, optionsClasses: "dropdown-menu"});

        this.setState({subfolder_dialog: true});
    }

    hideFolderDialog() {
        this.setState({subfolder_dialog: false});
    }

    goBack(e) {
        e.preventDefault();

        if(this.state.previous_folders.length != 0 || this.state.previous_folder != "") {
            const previous_folders = [...this.state.previous_folders];
            const previous_folder = previous_folders[previous_folders.length - 1];
            previous_folders.pop();

            this.setState({folder_name: previous_folder, previous_folders: previous_folders});
        } 
        
    }

    render() {
        const file_rows = [];
        const folder_rows = [];

        if(this.props.files != null) {
            this.createRows(this.props.files[""], file_rows, folder_rows);
        }

        let subfolder_dialog = null;
        if(this.state.subfolder_dialog) {
            subfolder_dialog = <AddFolderDialog 
                hideFolderDialog={() => {this.hideFolderDialog()}}
                previous_folders={[...this.state.previous_folders, this.state.folder_name]}
                files={this.props.files}
            />;
        }

        
        // style="position: absolute; transform: translate3d(82px, 52px, 0px); top: 0px; left: 0px; will-change: transform;"
        // const file_rows = this.state.paths.map(file => {
        //     return <FileTableRow file_info={file} key={file.id} />;
        // }) 

        let uploaderBar = null;
        if(this.state.uploadingFile) {
            uploaderBar = <UploaderProgressBar percent={this.state.uploadPercentComplete} />;
        }

        let back_nav = null;
        if(this.state.previous_folders.length > 0) {
            back_nav = <tr>
                <td>
                    <Link to='/files' onClick={(e) => { this.goBack(e) }} >
                        &lt;&lt; BACK
                    </Link>
                </td>
                <td>
                </td>
                <td className="text-align-end">
                </td>
            </tr>;
        }

        return (
            <div className="row gutters-sm">

						<div className="col-12 mb-3">


							<div className="portlet">

								<div className="portlet-header border-bottom">
									<span>Your Files</span>
								</div>

								<div className="portlet-body">
                                    {uploaderBar}
                                    
                                    
                                        <input style={{display: "none"}} ref="filename" type="file" name="uploader"></input>
                                    
									<div className="container py-6">
                                        {/* <div className="pull-right" style={{marginBottom: "10px"}}>
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
                                                    <a className="dropdown-item active" onClick={(e) => this.openSubFolderDialog(e)} href="#">
                                                        <i className="fa fa-upload" aria-hidden="true"></i>
                                                        Add a subfolder
                                                    </a>
                                                </div>
                                            </div> 
                                        </div> */} 
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
                                                        {back_nav}
                                                        {folder_rows}
														{file_rows}
													</tbody>

													{/* <tfoot>
														<tr>
                                                            <th className="text-gray-500 font-weight-normal fs--14 min-w-300">FILE NAME</th>
															<th className="text-gray-500 font-weight-normal fs--14 w--100 text-center">LAST MODIFIED</th>
                                                            <th className="text-gray-500 font-weight-normal fs--14 w--60 text-align-end">&nbsp;</th>
														</tr>   
													</tfoot> */}

												</table>
											</div>

                                            

									</div>

                                    {subfolder_dialog}
								</div>

							</div>

						</div>

					</div>
        )
    }
}

export default FoldersView;