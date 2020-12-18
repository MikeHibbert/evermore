import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Moment from 'react-moment';
import DownloadLink from "react-download-link";
import DownloadFile from './Download';


class Downloads extends Component {
    state = {
        downloading: false
    }

    componentWillUnmount() {
        document.body.classList.remove('home-version-four');
        document.body.id = "home-version-four";
    }

    getDataFromURL = (url) => new Promise((resolve, reject) => {
        this.setState({downloading: true});
        const that = this;
        setTimeout(() => {
            fetch(url, {redirect: 'follow'})
                .then(response => response.text())
                .then(data => {
                    that.setState({downloading: false});
                    resolve(data);
                });
        });
    }, 20);

    render() {
        const windows_release = "https://arweave.net/SwKg8XwQTk4X-_pHUdd7zOnqFlRacqjoC-G_JVSMQNM";

        let windows_download_link = <DownloadFile url={windows_release} filename="evermore_setup-0.9.3.exe" setDownloading={(downloading) => { this.setState({downloading: downloading}); }} />;
        if(this.state.downloading) {
            windows_download_link = <div>Downloading Installer from the blockchain... <img style={{height: '32px'}} src="images/spinner.svg" /></div>;
        }
        return (
            <>
                <link rel="stylesheet" href="css/style.css"></link>
                <link rel="stylesheet" href="css/responsive.css"></link>
                <link rel="stylesheet" href="css/master.css"></link>
                 


            <div className="cloud-hosting spreed_top_1 pt-120 pb-200" id="downloads">
                <div className="container">
                    <div className="row">
                        <div className="col-md-5">
                            <div className="cloud-content">
                                <h2>Downloads</h2>
                                <p>Download one of our desktop apps to begin saving your data to the blockchain.<br/><br/>

                                    Your data is stored on the “Permaweb", which means it can never be deleted or taken down.<br/><br/>

                                    In addition, we keep a full version history so that you can always get your hands on older versions of your data at any point<br/>
                                </p>
                                <p>Currently we have launched a Windows 10 64bit version of Evermore and will shortly be releasing for Mac and Linux too!</p>
                                <p> 
                                    <strong>Windows 10 Beta Installer </strong>
                                    
                                    {windows_download_link}

                                </p>
                                </div>
                            <div className="embed-responsive embed-responsive-16by9">
                                <h2>Setup guide</h2>
                                <iframe width="800" height="600" src="https://www.youtube.com/embed/VEGofk0JDps" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                            </div>
                        </div>

                        <div className="offset-md-1 col-md-6">
                            <div className="speed--Secured-section pt-20 pr-20">
                                <img src="images/img-part/support_2.png" alt="" className="supprt_2" />
                                <div className="left_img">
                                    <img src="images/img-part/support4_1.png" alt="" className="supprt_1" />
                                    <div className="img_shape">
                                        <img src="images/img-part/services4_1.png" alt="" className="ser_1" />
                                        <img src="images/img-part/services4_2.png" alt="" className="ser_2" />
                                        <img src="images/img-part/services4_2.png" alt="" className="ser_3" />
                                        <img src="images/img-part/services4_2.png" alt="" className="ser_4" />
                                        <img src="images/img-part/services4_2.png" alt="" className="ser_5" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="pt-120">
            <div className="container">
                <div className="footer-top pb-70">
                <div className="row">
                    <div className="col-12 col-md-6 col-lg-4">
                        <div className="footer-title">
                            <img src="images/evermore-logo-light.png" alt="" className="f_logo" />
                            <p>As the need for reliable data storage grows; so will the need for a secure, permanent, and cost-effective data storage solution. At Evermore, we provide the framework to make this solution a reality. </p>
                        </div>
                    </div>
                    <div className="col-12 col-md-6 col-lg-3">
                        <div className="footer-link">
                            <h3>Quick Link</h3>
                            <ul>
                                <li><a href="/">Evermore</a></li>                                
                            </ul>
                        </div>
                    </div>
                    
                    

                </div>
                </div>
            </div>
            <div className="footer-bottom">
                <div className="container">
                    <div className="row">
                        <div className="col-md-6">
                            <p>Copyright@ Hibbert IT Solutions Limited <Moment format={"YYYY"}>{new Date()}</Moment></p>
                        </div>
                        <div className="col-md-6 text-right">
                            <ul>
                                <li><a href="privecy.html">Privacy</a></li>
                                <li><a href="team-page.html">Team</a></li>
                                <li><a href="index.html">Sitmap</a></li>                    
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
            </>
        )
    }
}

export default Downloads;