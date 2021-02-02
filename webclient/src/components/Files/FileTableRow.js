import React, {Component} from 'react';
import Moment from 'react-moment';
import axios from 'axios';
import { Link } from 'react-router-dom';
import arweave from '../../arweave-config';
import { toast } from 'react-toastify';
import { createPersistenceRecord } from '../../containers/Files/helpers';
import { magicDownload } from '../../containers/Home/Download';

const DownloaderProgressBar = (props) => {
    return (
        <div id="clipboard_4" className="mb-3">
            <div className="progress mb-3" style={{backgroundColor: 'transparent'}} >
                <div className="progress-bar progress-bar-animated" 
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
        progress: 0
    }

    constructor(props) {
        super(props);

        this.toggleOptions.bind(this);
    }

    componentDidMount() {
        // document.addEventListener(
        //     "click",
        //     event =>  this.setState({
        //         optionsDialogCss: "dropdown-menu dropdown-menu-clean dropdown-click-ignore max-w-220",
        //         optionsDialogStyles: null,
        //         optionParentCss: "clearfix"
        //     })
        //   );
    }

    toggleOptions() {
         if(!this.state.optionsDialogStyles) {
            this.setState({
                optionsDialogCss: "dropdown-menu dropdown-menu-clean dropdown-click-ignore max-w-220 show",
                optionsDialogStyles: {
                    position: "absolute",
                    transform: "translate3d(1014px, 174px, 0px)",
                    top: "0px",
                    left: "0px",
                    willChange: "transform"
                },
                optionParentCss: "clearfix"
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
        return new Promise((resolve, reject) => {
            that.setState({downloading: true});

            setTimeout(() => {
                console.log(`https://arweave.net/${that.props.file_info.id}`)
                axios({
                    url: `https://arweave.net/${that.props.file_info.id}`,
                    responseType: 'blob',
                    onDownloadProgress: function (progressEvent) {
                        // Do whatever you want with the native progress event
                        const percent = Math.floor(progressEvent.loaded / progressEvent.total * 100);
                        that.setState({progress: percent});
                    },
                }).then(response => {
                    debugger;
                    that.setState({downloading: false});
                    const parts = this.props.file_info.path.split("/");
                    const filename = parts[parts.length - 1];
                    
                    magicDownload(response.data, filename, that.props.file_info['Content-Type']);
                    resolve(response.data);
                });
            });
        
        }, 20);
    }

    async archiveTransaction() {
            await createPersistenceRecord(this.props.file_info, true, this.props.wallet_jwk);
    
            toast(`${this.props.file_info.file} is now being archived`, { type: toast.TYPE.SUCCESS }); 
    }

    render() {

        const parts = this.props.file_info.path.split("/");
        const filename = parts[parts.length - 1];

        const last_modified = <Moment format={"DD/MM/YYYY HH:mm"}>{this.props.file_info.modified}</Moment>;

        let downloader = null;
        if(this.state.downloading) {
            downloader = <>
                        <div>Downloading Installer from the blockchain... <img style={{height: '32px'}} src="images/spinner-dark.svg" /></div>
                        <DownloaderProgressBar percent={this.state.progress} /></>;
        }

        let download_option = null;
        if(this.props.file_info.path.indexOf('/Public') != -1) {
            download_option = <div className="scrollable-vertical max-h-50vh">

                <a className="dropdown-item text-truncate" style={{cursor:'pointer'}} onClick={() => { this.downloadFile() }}>
                    <i className="fa fa-download"></i>
                    Download
                </a>
            </div>;
        }

        return (
            <tr>
                <td>
                        {filename}
                        {downloader}
                    <span className="d-block text-muted fs--13">FROM: {this.props.file_info.hostname}</span>
                    {/* <span className="d-block text-muted fs--13">VERSION: {this.props.file_info.version}</span> */}

                </td>


                <td>

                    <span className="d-block text-danger fs--15">
                        <sup className="text-muted fs--10">{last_modified}</sup>
                    </span>
                </td>

                <td className="text-align-end">

                    <div className={this.state.optionParentCss}>

                        <a onClick={() => {this.toggleOptions()}} onBlur={() => {this.toggleOptions()}} className="btn btn-sm btn-light rounded-circle js-stoppropag">
                            <span className="group-icon">
                                <i className="fi fi-dots-vertical-full"></i>
                                <i className="fi fi-close"></i>
                            </span>
                        </a>

                        <div className={this.state.optionsDialogCss} style={this.state.optionsDialogStyles}>
                            
                            {download_option}
                            <div className="scrollable-vertical max-h-50vh" >

                                <a className="dropdown-item text-truncate" style={{cursor:'pointer'}} onClick={() => { this.archiveTransaction() }} >
                                    <i className="fa fa-download"></i>
                                    Archive
                                </a>
                            </div>

                        </div>

                    </div>

                </td>

            </tr>
        );
    }
} 

export default FileTableRow;