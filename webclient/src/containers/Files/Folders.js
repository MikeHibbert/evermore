import React, {Component} from 'react';
import os from 'os';
import FileTableRow from '../../components/Files/FileTableRow';
import FolderTableRow from '../../components/Files/FolderTableRow';
import settings from '../../app-config';
import {SaveUploader, RemoveUploader, addFolderInfoToPathInfos} from './helpers';
import { Link } from 'react-router-dom';
import AddFolderDialog from './AddFolderDialog';
import {addToFolderChildrenOrUpdate} from './helpers';
import worker from 'workerize-loader!./upload.worker';  
import { toast } from 'react-toastify';
import { sendUsagePayment, uploadFile } from '../../crypto/arweave-helpers';
import Arweave from 'arweave/web';
import mime from 'mime-types';
import { magicDownload } from '../Home/Download';

const arweave = Arweave.init({
    host: 'arweave.net',// Hostname or IP address for a Arweave host
    port: 443,          // Port
    protocol: 'https',  // Network protocol http or https
    timeout: 20000,     // Network request timeouts in milliseconds
    logging: false,     // Enable network request logging
});

const UploaderProgressBar = (props) => {
    const classNames = props.encrypting ? "progress-bar progress-bar-striped progress-bar-animated bg-success" : "progress-bar progress-bar-animated progress-bar-striped";
    return (
        <div className="mb-3">
            <div className="progress mb-3">
                <div className={classNames} role="progressbar" style={{width: props.percent + "%"}} ></div>
            </div>
        </div>
    )
} 

// const DownloaderProgressBar = (props) => {
//     const css_classes = props.decrypting ? "progress-bar progress-bar-striped progress-bar-animated": "progress-bar progress-bar-striped progress-bar-animated decrypting";
//     return (
//         <div id="clipboard_4" className="mb-3">
//             <div className="progress mb-3">
//                 <div className={css_classes} role="progressbar" style={{width: props.percent + "%"}} ></div>
//             </div>
//         </div>
//     )
// } 


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

    componentDidMount() {
        
        this.upload_worker = new worker();
        const that = this;
        
        this.upload_worker.addEventListener('message', async (message) => {
            const msg = message.data;

            if(msg.action == 'uploading') {
                that.setState({uploadingFile: msg.uploading});
            }

            if(msg.action == 'progress') {
                that.setState({uploadPercentComplete: msg.progress});
            }

            if(msg.action == 'encrypting') {
                if(msg.hasOwnProperty('encrypting')) {
                    that.setState({encrypting: msg.encrypting});
                }
                if(msg.hasOwnProperty('progress')) {
                    that.setState({progress: msg.progress});
                }
            }

            if(msg.action == 'begin-upload' && !that.state.uploadingFile) {
                that.setState({encrypting: false});
                const file_info = msg.file_info;
                let file_data = msg.encrypted_result.encrypted_data;
                
                file_info['file_data'] = file_data;
                
                magicDownload(msg.encrypted_result.data, msg.file_info.name, 'application/text');

                const data_cost = await arweave.transactions.getPrice(parseInt(file_info.file_size + msg.encrypted_result.key_size));

                await uploadFile(
                    this.props.jwk,
                    parseFloat(this.props.wallet_balance),
                    file_info,
                    data_cost,
                    false,
                    msg.encrypted_result.key_size,
                    arweave,
                    function (msg) {
                        if(msg.action == 'uploading') {
                            that.setState({uploadingFile: msg.uploading});
                        }
            
                        if(msg.action == 'progress') {
                            that.setState({uploadPercentComplete: msg.progress});
                        }
            
                        if(msg.action == 'upload-complete' && !that.state.uploadingFile) {
                            sendUsagePayment(msg.cost, that.props.jwk, arweave);
                        }
                    },
                    (msg) => { that.props.addSuccessAlert(msg) },
                    (msg) => { that.props.addErrorAlert(msg) }
                );
            }

            
        }) 
    }

    onSelectFolder(folder_name) {
        const previous_folders = [...this.state.previous_folders];
        previous_folders.push(this.state.folder_name);
        this.setState({folder_name: folder_name, previous_folders: previous_folders});
    }

    async onUploadFileHandler(e) {
        e.preventDefault();

        const file_handle = e.target.files[0];

        const previous_folders = [...this.state.previous_folders, this.state.folder_name];

        const file_path = `${previous_folders.join('/')}/${file_handle.name}`;

        let file_info = { 
            file_handle: file_handle,
            path: file_path, 
            name: file_handle.name, 
            file: file_handle.name, 
            file_size: file_handle.size.toString(),
            modified: file_handle.lastModified,
            is_update: false,
            hostname: "EVERMORE WEBCLIENT",
            children: [], 
            type: 'file', 
            checked: true, 
            tx_id: null
        };

        let path_parts = file_info.path.split('/');
            
        if(path_parts.length > 1) {
            if(this.props.files.hasOwnProperty(path_parts[0])) {
                addToFolderChildrenOrUpdate(path_parts, 0, file_info, this.props.files[path_parts[0]], 0);                
            }           
        }  

        const public_folders = this.state.previous_folders.filter(f => f == 'Public');

        let is_public = public_folders.length > 0 || this.state.folder_name == 'Public' ? true : false;

        let jwk = null;

        const wallet_balance = parseFloat(this.props.wallet_balance);

        if(!is_public) {
            jwk = await arweave.wallets.generate(); // needed to be generated here so we can use 'arweave/web' version instead of 'arweave/node'

            this.upload_worker.encryptFileHandler([
                file_info,
                this.props.jwk,
                jwk,
                wallet_balance
            ])
        } else {
            this.setState({uploadingFile: true})
            const reader = new FileReader();
            reader.onload = async function() {
                let file_data = reader.result;
                file_info['file_data'] = file_data;

                const data_cost = await arweave.transactions.getPrice(parseInt(file_info.file_size));

                const that = this;

                await uploadFile(
                    this.props.jwk,
                    parseFloat(this.props.wallet_balance),
                    file_info,
                    data_cost,
                    true,
                    -1,
                    arweave, 
                    function (msg) {
                        if(msg.action == 'uploading') {
                            that.setState({uploadingFile: msg.uploading});
                        }
            
                        if(msg.action == 'progress') {
                            that.setState({uploadPercentComplete: msg.progress});
                        }

                        if(msg.action == 'upload-complete' && !that.state.uploadingFile) {
                            sendUsagePayment(msg.cost, that.props.jwk, arweave);
                        }            
                    },
                    (msg) => { that.props.addSuccessAlert(msg) },
                    (msg) => { that.props.addErrorAlert(msg) }
                );
            }
            reader.readAsBinaryString(file_info.file_handle);

            
        }
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
                        const public_folders = this.state.previous_folders.filter(f => f == 'Public');

                        let is_public = public_folders.length > 0 || this.state.folder_name == 'Public' ? true : false;

                        file_rows.push(
                            <FileTableRow 
                                file_info={path} 
                                key={i} 
                                wallet={this.props.jwk}
                                downloadFile={(e) => {this.download(e, file_info)}}
                                is_public={is_public}
                            />
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
            uploaderBar = <UploaderProgressBar percent={this.state.uploadPercentComplete} encypting={this.state.encrypting} />;
        }

        if(this.state.encrypting) {
            uploaderBar = <UploaderProgressBar percent={this.state.progress} encypting={this.state.encrypting} />;
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
                                    
                                    
                                        <input style={{display: "none"}} ref="filename" type="file" name="uploader" onChange={(e) => { this.onUploadFileHandler(e)}}></input>
                                    
									<div className="container py-6">
                                        {/* <div className="pull-left" style={{marginBottom: "10px"}}>
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
                                        </div>  */}
											<div className="table-responsive">
												<table className="table table-framed">
													<thead>
														<tr>
															<th className="text-gray-500 font-weight-normal fs--14 min-w-300">FILE NAME</th>
                                                            <th className="text-gray-500 font-weight-normal fs--14 w--100 text-center">SIZE</th>
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