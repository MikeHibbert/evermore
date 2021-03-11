import React, {Component} from 'react';
import os from 'os';
import FileTableRow from '../../components/Files/FileTableRow';
import FolderTableRow from '../../components/Files/FolderTableRow';
import settings from '../../app-config';
import {SaveUploader, RemoveUploader, addFolderInfoToPathInfos} from './helpers';
import { Link } from 'react-router-dom';
import AddFolderDialog from './AddFolderDialog';
import AddNFTDialog from './AddNFTDialog';
import {addToFolderChildrenOrUpdate} from './helpers';
import worker from './upload.worker';  // eslint-disable-line import/no-webpack-loader-syntax
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
        subfolder_dialog: false,
        nft_dialog: false
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
                let file_data = Buffer.from(msg.encrypted_result.encrypted_data, 'binary');
                
                file_info['file_data'] = file_data;

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
                            debugger;
                            file_info['id'] = msg.tx_id;
                            file_info['tx_id'] = msg.tx_id;
                            that.addFileInfoToFolders(file_info);
                        }
                    },
                    (msg) => { that.props.addSuccessAlert(msg); },
                    (msg) => { that.props.addErrorAlert(msg) },
                    false
                );
            } 
        });
    }

    removeFromFiles(file_info, ContractTXID) {
        if(file_info.type == 'folder') {
            let found = false;
            for(let i in file_info.children) {
                const child = file_info.children[i];

                if(child.type == 'folder') {
                    this.removeFromFiles(child, ContractTXID);
                } else {
                    if(child.Contract == ContractTXID) {
                        found = true;
                    }
                }
            }

            if(found) {
                const remaining = file_info.children.filter(child => child.Contract != ContractTXID);

                file_info.children = remaining;
            }
        } 
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
            created: file_handle.lastModified,
            is_update: false,
            hostname: "EVERMORE WEBCLIENT",
            children: [], 
            type: 'file', 
            checked: true, 
            tx_id: null,
            mining: true
        };

        let path_parts = file_info.path.split('/');
            
        if(path_parts.length > 1) {
            if(this.props.files.hasOwnProperty(path_parts[0])) {
                addToFolderChildrenOrUpdate(path_parts, 0, file_info, this.props.files[path_parts[0]], 0);                
            }           
        }  

        const public_folders = this.state.previous_folders.filter(f => f == 'Public');
        const nft_folders = this.state.previous_folders.filter(f => f == 'NFTs');

        let is_public = public_folders.length > 0 || this.state.folder_name == 'Public' ? true : false;
        let is_nft = nft_folders.length > 0 || this.state.folder_name == 'NFTs' ? true : false;

        let jwk = null;

        const wallet_balance = parseFloat(this.props.wallet_balance);

        if(!is_public && !is_nft) {
            jwk = await arweave.wallets.generate(); // needed to be generated here so we can use 'arweave/web' version instead of 'arweave/node'

            this.upload_worker.encryptFileHandler([
                file_info,
                this.props.jwk,
                jwk,
                wallet_balance
            ])
        } else {
            this.setState({uploadingFile: true});
            const that = this;
            const reader = new FileReader();
            reader.onload = async function() {
                let file_data = reader.result;
                file_info['file_data'] = Buffer.from(file_data, 'binary');

                const data_cost = await arweave.transactions.getPrice(parseInt(file_info.file_size));

                let nftName = null;
                let nftDescription = null;

                if(is_nft) {
                    nftName = e.nftName;
                    nftDescription = e.nftDescription;
                }

                await uploadFile(
                    that.props.jwk,
                    parseFloat(that.props.wallet_balance),
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
                            debugger;
                            file_info['id'] = msg.tx_id;
                            file_info['tx_id'] = msg.tx_id;
                            that.addFileInfoToFolders(file_info);
                        }  
                    },
                    (msg) => { that.props.addSuccessAlert(msg) },
                    (msg) => { that.props.addErrorAlert(msg) },
                    is_nft,
                    nftName,
                    nftDescription
                );
            }
            reader.readAsBinaryString(file_info.file_handle);

            
        }
    }

    addFileInfoToFolders(file_info) {
        debugger;
        this.props.addToTransactionsToBeMined({name: file_info.name, id: file_info.id});
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
                        const nft_folders = this.state.previous_folders.filter(f => f == 'NFTs');

                        let is_public = public_folders.length > 0 || this.state.folder_name == 'Public' ? true : false;
                        let is_nft = nft_folders.length > 0 || this.state.folder_name == 'NFTs' ? true : false;

                        file_rows.push(
                            <FileTableRow 
                                file_info={path} 
                                key={i} 
                                wallet={this.props.jwk}
                                downloadFile={(e) => {this.download(e, file_info)}}
                                is_public={is_public}
                                is_nft={is_nft}
                                is_mined={file_info.mined}
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

    openNFTDialog(e) {
        e.preventDefault();

        this.setState({nft_dialog: true});
        this.onToggleOptions();
    }

    openSubFolderDialog(e) {
        e.preventDefault();

        this.setState({optionsStyle: null, optionsClasses: "dropdown-menu"});

        this.setState({subfolder_dialog: true});

        this.onToggleOptions();
    }

    hideFolderDialog() {
        this.setState({subfolder_dialog: false});
        this.onToggleOptions()
    }

    hideNFTDialog() {
        this.setState({nft_dialog: false});
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
        let table_display = <img style={{height: '320px'}} src="images/spinner-dark.svg" />;

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

        if(this.props.files != null) {
            
            this.createRows(this.props.files[""], file_rows, folder_rows);  
            table_display = <table className="table table-framed">
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

                        </table>;

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

        

        const nft_folders = this.state.previous_folders.filter(f => f == 'NFTs');
        let is_nft = nft_folders.length > 0 || this.state.folder_name == 'NFTs' ? true : false;

        let upload_option = <a className="dropdown-item active" onClick={(e) => this.openFileDialog(e)} href="#">
                                <i className="fa fa-upload" aria-hidden="true"></i>
                                Upload to this folder
                            </a>;

        let nft_info = null;
        if(is_nft) {
            upload_option = <a className="dropdown-item active" onClick={(e) => this.openNFTDialog(e)} href="#">
                                <i className="fa fa-upload" aria-hidden="true"></i>
                                Create New NFT
                            </a>;

            nft_info = <> 
                    <div className="bg-white shadow-xs p-2 mb-4 rounded">
                        <div className="clearfix bg-light p-2 rounded d-flex align-items-center">
                            <span className="btn row-pill btn-sm bg-gradient-warning b-0 py-1 mb-0 float-start">
                                <i className="fi fi-round-info-full"></i>
                                Note
                            </span>
                            <span className="d-block px-2 text-muted text-truncate">
                                To create an NFT select ACTIONS > Create New NFT. 
                            </span>
                       </div>
                    </div>
                    <div className="bg-white shadow-xs p-2 mb-4 rounded">
                        <div className="clearfix bg-light p-2 rounded d-flex align-items-center">
                            <span className="btn row-pill btn-sm bg-gradient-warning b-0 py-1 mb-0 float-start">
                                <i className="fi fi-round-info-full"></i>
                                Note
                            </span>
                            <span className="d-block px-2 text-muted text-truncate">
                                To transfer ownership click the file link in the table below and choose "Transfer Ownership". The NFT will remain visible until the transfer has been mined on the blockchain
                            </span>
                        </div>
                    </div>
                </>;
        }

        let nft_dialog = null;
        if(this.state.nft_dialog) {
            nft_dialog = <AddNFTDialog 
                hideFolderDialog={() => {this.hideNFTDialog()}}
                onUploadFileHandler={(e) => this.onUploadFileHandler(e)}
                previous_folders={[...this.state.previous_folders, this.state.folder_name]}
                files={this.props.files}
            />;
        }

        

        return (
            <div className="row gutters-sm">

						<div className="col-12 mb-3">
                            {nft_info}

							<div className="portlet">

								<div className="portlet-header border-bottom">
									<span>Your Files</span>
								</div>

								<div className="portlet-body">
                                    {uploaderBar}
                                    
                                    
                                        <input style={{display: "none"}} ref="filename" type="file" name="uploader" onChange={(e) => { this.onUploadFileHandler(e)}}></input>
                                    
									<div className="container py-6">
                                        <div className="pull-left" style={{marginBottom: "10px"}}>
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
                                                    {upload_option}
                                                    <a className="dropdown-item active" onClick={(e) => this.openSubFolderDialog(e)} href="#">
                                                        <i className="fa fa-upload" aria-hidden="true"></i>
                                                        Add a subfolder
                                                    </a>
                                                </div>
                                            </div> 
                                        </div> 
											<div className="table-responsive">
												{table_display}
											</div>

                                            

									</div>

                                    {subfolder_dialog}      
                                    {nft_dialog}

								</div>

							</div>

						</div>

					</div>
        )
    }
}

export default FoldersView;