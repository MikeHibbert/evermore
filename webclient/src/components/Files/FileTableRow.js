import React, {Component} from 'react';
import Moment from 'react-moment';
import axios from 'axios';
import { Link } from 'react-router-dom';
import arweave from '../../arweave-config';
import { toast } from 'react-toastify';
import { createPersistenceRecord } from '../../containers/Files/helpers';
import { magicDownload } from '../../containers/Home/Download';
import { decryptFileData } from '../../crypto/files';
// import WebWorkerEnabler from './WebWorkerEnabler';
// import WebWorker from './WebWorker';
import worker from 'workerize-loader!./download_worker'; // eslint-disable-line import/no-webpack-loader-syntax

const DownloaderProgressBar = (props) => {
    const classNames = props.decrypting ? "progress-bar progress-bar-striped progress-bar-animated bg-success" : "progress-bar progress-bar-animated";
    return (
        <div className="col-12 mb-3">
            <div className="progress mb-3" style={{backgroundColor: 'transparent'}} >
                <div className={classNames}
                     role="progressbar" 
                     style={{width: props.percent + "%"}} 
                     ></div>
            </div>
        </div>
    )
} 

class FileTableRow extends Component  {
    state = {
        optionsDialogCss: "dropdown-menu dropdown-menu-clean dropdown-click-ignore max-w-220",
        optionsDialogStyles: null,
        optionParentCss: "clearfix",
        downloading: false,
        is_public: false,
        progress: 0,
        decrypting: false
    }

    constructor(props) {
        super(props);

        this.toggleOptions.bind(this);
        this.ref = React.createRef();
    }

    componentDidMount() {
        this.download_worker = worker();
        const that = this;
        this.download_worker.addEventListener('message', (message) => {
            const msg = message.data;

            if(msg.action == 'downloading') {
                that.setState({downloading: msg.downloading});
            }

            if(msg.action == 'progress') {
                that.setState({progress: msg.progress});
            }

            if(msg.action == 'decrypting') {
                if(msg.hasOwnProperty('decrypting')) {
                    that.setState({decrypting: msg.decrypting, progress: 0});
                }
                if(msg.hasOwnProperty('progress')) {
                    that.setState({progress: msg.progress});
                }
            }

            if(msg.action == 'download-complete' && !that.state.downloading) {
                that.setState({decrypting: msg.decrypting})

                magicDownload(msg.data, that.props.file_info.name, that.props.file_info['Content-Type']);
            }
        })   
    }

    toggleOptions() {
         if(!this.state.optionsDialogStyles) {
            const ref = this.ref.current;
            ref.focus();
            const element_height = this.props.is_public ? 120 : 60;
            const y = ref.offsetTop - element_height;
            const x = ref.offsetLeft - 120;

            this.setState({
                optionsDialogCss: "dropdown-menu dropdown-menu-clean dropdown-click-ignore max-w-220 show",
                optionsDialogStyles: {
                    position: "absolute",
                    transform: `translate3d(${x}px, ${y}px, 0px)`,
                    top: "0px",
                    left: "0px",
                    willChange: "transform"
                },
                optionParentCss: "clearfix show"
            });
        } else {
            
            this.setState({
                optionsDialogCss: "dropdown-menu dropdown-menu-clean dropdown-click-ignore max-w-220",
                optionsDialogStyles: null,
                optionParentCss: "clearfix"
            });
        }
    }

    downloadFile(){
        const that = this;
        this.toggleOptions();

        this.setState({downloading: true});

        this.download_worker.downloadFile([this.props.wallet, this.props.file_info]);
            
    }

    async archiveTransaction() {
            await createPersistenceRecord(this.props.file_info, true, this.props.wallet_jwk);
    
            toast(`${this.props.file_info.file} is now being archived`, { type: toast.TYPE.SUCCESS }); 
    }


    bytesToSize(bytes) {
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes == 0) return '0 Byte';
        var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + '' + sizes[i];
     }

    render() {

        const parts = this.props.file_info.path.split("/");
        const filename = parts[parts.length - 1];
        const file_size = this.bytesToSize(parseInt(this.props.file_info.file_size));
        const viewblock_url = `https://viewblock.io/arweave/tx/${this.props.file_info.id}`;

        const last_modified = <Moment format={"DD/MM/YYYY HH:mm"}>{this.props.file_info.modified}</Moment>;

        let downloader = null;
        if(this.state.downloading) {
            downloader = <>
                        <div className="col-12">Downloading from the blockchain... <img style={{height: '32px'}} src="images/spinner-dark.svg" /></div>
                        <DownloaderProgressBar percent={this.state.progress} /></>;
        }
        if(this.state.decrypting) {
            downloader = <>
                        <div className="col-12">Decrypting file data... <img style={{height: '32px'}} src="images/spinner-dark.svg" /></div>
                        <DownloaderProgressBar percent={this.state.progress} decrypting={true} /></>;
        }

        let download_option = null;
        
        download_option = <div className="scrollable-vertical max-h-50vh">

            <a className="dropdown-item text-truncate" style={{cursor:'pointer'}} onClick={async () => { await this.downloadFile() }}>
                <i className="fa fa-download"></i>
                Download
            </a>
        </div>;
        
        let filename_url = filename;
        if(this.props.is_nft) {
            const url = `/file/${this.props.file_info.id}`;
            filename_url = <Link to={url}>{filename}</Link>
        }

        return (
            <tr>
                <td>
                        {filename_url} 
                        {downloader}
                    <span className="d-block text-muted fs--13">FROM: {this.props.file_info.hostname}</span>
                    {/* <span className="d-block text-muted fs--13">VERSION: {this.props.file_info.version}</span> */}

                </td>
                <td>
                    {file_size}
                </td>


                <td>

                    <span className="d-block text-danger fs--15">
                        <sup className="text-muted fs--10">{last_modified}</sup>
                    </span>
                </td>

                <td className="text-align-end">

                    <div className={this.state.optionParentCss}>

                        <a ref={this.ref} onClick={() => {this.toggleOptions()}} className="btn btn-sm btn-light rounded-circle js-stoppropag">
                            <span className="group-icon">
                                <i className="fi fi-dots-vertical-full"></i>
                                <i className="fi fi-close"></i>
                            </span>
                        </a>

                        <div className={this.state.optionsDialogCss} style={this.state.optionsDialogStyles} x-placement="bottom-start">
                            
                            {download_option}
                            <div className="scrollable-vertical max-h-50vh" >

                                <a className="dropdown-item text-truncate" style={{cursor:'pointer'}} href={viewblock_url} target="_blank">
                                    <i className="fa fa-download"></i>
                                    Transaction Details
                                </a>
                            </div>
                            {/* <div className="scrollable-vertical max-h-50vh" >

                                <a className="dropdown-item text-truncate" style={{cursor:'pointer'}} onClick={() => { this.archiveTransaction() }} >
                                    <i className="fa fa-download"></i>
                                    Archive
                                </a>
                            </div> */}

                        </div>

                    </div>

                </td>

            </tr>
        );
    }
} 

export default FileTableRow;