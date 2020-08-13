import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Moment from 'react-moment';


class Downloads extends Component {
    componentWillUnmount() {
        document.body.classList.remove('home-version-four');
        document.body.id = "home-version-four";
    }

    render() {
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
                                <p>Coming soon! We're currently working for Evermore on providing you with a seamless desktop integration but for now why not checkout our <Link to='/login' style={{display: "inline-block"}}>webclient</Link></p>
                            </div>
                        </div>

                        <div className="offset-md-1 col-md-6">
                            <div className="speed--Secured-section pt-20">
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
                                <p>We make storing and retreiving your data simple and super cost effective because the world is full of data. We bring win-win data storage solutions to everyone.</p>
                            </div>
                        </div>
                        <div className="col-12 col-md-6 col-lg-3">
                            <div className="footer-link">
                                <h3>Quick Link</h3>
                                <ul>
                                    <li><a href="/" >Evermore</a></li>
                                    <li><a href="/" >Data storage solutions</a></li>
                                    <li><a href="/" >Pricing Calculator</a></li>
                                    <li><a href="/" >Global Blockchain Network</a></li>
                                    <li><a href="/" >Software</a></li>
                                    
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
                            { /* <div className="col-md-6 text-right">
                                <ul>
                                    <li><a href="privecy.html">Privacy</a></li>
                                    <li><a href="team-page.html">Team</a></li>
                                    <li><a href="index.html">Sitmap</a></li>                    
                                </ul>
                            </div> */ }
                        </div>
                    </div>
                </div>
            </footer>



            { /* <section id="scroll-top" className="scroll-top">
                <h2 className="disabled">&nbsp;</h2>
                <div className="to-top pos-rtive">
                    <a href="#" onClick={e => {this.executeScroll(e, "intro")}}><i className= "fa fa-arrow-up"></i></a>
                </div>
            </section> */ }
            </>
        )
    }
}

export default Downloads;