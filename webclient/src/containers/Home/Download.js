import React, { Component } from 'react';
import DownloadLink from "react-download-link";
import axios from 'axios';
import {getFileWith} from '../Files/helpers';

const UploaderProgressBar = (props) => {
    return (
        <div id="clipboard_4" className="mb-3">
            <div className="progress mb-3">
                <div className="progress-bar progress-bar-animated" role="progressbar" style={{width: props.percent + "%"}} ></div>
            </div>
        </div>
    )
} 

function magicDownload(data, fileName, ContentType) {
    var blob = new Blob([data], {
      type: ContentType
    });

    // create hidden link
    var element = document.createElement("a");
    document.body.appendChild(element);
    element.setAttribute("href", window.URL.createObjectURL(blob));
    element.setAttribute("download", fileName);
    element.style.display = "";

    element.click();

    document.body.removeChild(element);
}

class DownloadFile extends Component {
    state = {
        downloading: false,
        progress: 0
    }   

    downloadFile(){
        const that = this;
        return new Promise((resolve, reject) => {
            that.setState({downloading: true});

            const file = getFileWith([that.props.tx_id]);

            setTimeout(() => {
                // fetch(`https://arweave.net/${that.props.tx_id}`, {redirect: 'follow'})
                //     .then(response => response.text())
                //     .then(data => {
                //         that.setState({downloading: true});
                //         magicDownload(data, that.props.filename, file['Content-Type']);
                //         resolve(data);
                //     });

                axios({
                    url: `https://arweave.net/${that.props.tx_id}`,
                    onDownloadProgress: function (progressEvent) {
                        // Do whatever you want with the native progress event
                        const percent = Math.floor(progressEvent.loaded / progressEvent.total * 100);
                        that.setState({progress: percent});
                    },
                }).then(response => {
                    that.setState({downloading: false});
                    magicDownload(response.data, that.props.filename, file['Content-Type']);
                    resolve(response.data);
                });
            });
        
        }, 20);
    }
    
    render() {
        let download_link = <><div class="cloud-btn">
                                <ul>
                                    <li>
                                        <a className="g-btn" style={{cursor: 'pointer'}}onClick={() => this.downloadFile()}>{this.props.label}</a></li>
                                </ul>
                            </div></>;

        if(this.state.downloading) {
            download_link = <>
                <p>Downloading Installer from the blockchain... <img style={{height: '32px'}} src="images/spinner.svg" /></p>
                <UploaderProgressBar percent={this.state.progress} />;
            </>;
        }

        return (
            <>
                <div>
                    {download_link}
                </div>
            </>
        )
    }
    
}

export default DownloadFile;