import React, {Component, useRef} from 'react';
import { Link } from 'react-router-dom';
import arweave from '../../arweave-config';
import CostCalculator from '../../components/Files/Calculator';
import Moment from 'react-moment';

const scrollToRef = (ref) => window.scrollTo(0, ref.current.offsetTop)   

class HomePage extends Component {
    constructor() {
        super();

        this.executeScroll.bind(this);
    }

    executeScroll(e, elem_id) {
        e.preventDefault();

        window.scrollTo({
            behavior: "smooth",
            top: document.getElementById(elem_id).getBoundingClientRect().top - document.body.getBoundingClientRect().top
        });
    }

    componentDidMount() {
        document.body.classList.add('home-version-four');
        document.body.id = "home-version-four";

        window.gtag('event', 'page_view', {
            page_title: 'index',
            page_location: '/',
            page_path: '/',
            send_to: 'G-YSH82SBB2L'
          });
    }

    componentWillUnmount() {
        document.body.classList.remove('home-version-four');
        document.body.id = "home-version-four";
    }

    render() {
        return (<>
            <link rel="stylesheet" href="css/style.css"></link>
            <link rel="stylesheet" href="css/responsive.css"></link>
            <link rel="stylesheet" href="css/master.css"></link>
            <header className="banner-area" id="intro">
        
            <div className="shape-header">
                <div className="small-shape"></div>
                <div className="big-left"><img src="images/shape-left.png" alt="" /></div>
                <div className="shape-right"><img src="images/shape-right.png" alt="" /></div>
            </div>	

            <div className="nav-header">

                <div className="header-top">
                    <div className="container">
                        <div className="top-flex">
                            <div className="top-area-left">
                                <div className="left-header-top">
                                    <div className="email">
                                        <span className="header-top-icon"><i className="fa fa-envelope-o"></i></span><p>support@evermoredata.store</p>
                                    </div>
                                </div>
        
                            </div>
                            <div className="top-area-right text-right">
                                <div className="right-header-top">
                                    <ul>
                                        <li><Link to='login'><i className="fa fa-user header-top-icon"></i>login</Link></li>
                                        { /* <li><Link to='support'><i className="fa fa-headphones header-top-icon"></i>support</Link></li> */ }
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="eco_nav">
                    <div className="container">
                        <nav className="navbar navbar-expand-md navbar-light bg-faded">
                            <a className="navbar-brand navbar-logo" href="index.html"><img src="images/evermore-logo.png" alt="" /></a>
                             <div className="collapse navbar-collapse main-menu" id="navbarSupportedContent">
                              <ul className="navbar-nav nav ml-auto"> 
                                    <li className="nav-item p-nav">{ <Link to='/downloads' className="nav-link nav-menu">Downloads</Link>  }</li>   
                                    { /* <li className="nav-item p-nav"><a href="/contact" className="nav-link nav-menu">Contact</a></li> */ }
                                </ul> 
                            </div>
                            <div className="demo">  
                                <div className="mr-auto sign-in-option btn-demo" data-toggle="modal" data-target="#myModal2">
                                    <ul className="navbar-nav">
                                        <li>
                                            <a href="#"><img src="images/img-part/menu1.png" alt="" /></a>
                                        </li>
                                    </ul>
                                </div>
                            </div>  
                        </nav>
                    </div> 
                </div> 
            </div>	

            <div className="banner-body" id="intro">
                <div className="container">
                    <div className="row">			
                        <div className="col-md-6">
                            <div className="banner-body-content">
                                <h2>Your data stored ... <br/>For Evermore!</h2>
                                <p>Never pay to access your data again. Pay to Upload . Access FREE forever.</p>
                                <Link to='/downloads' className="g-btn">Get Started for FREE</Link>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="banner-body-image">
                                <img src="images/img-part/cloud_main.png" alt="" className="img_main" />
                                <img src="images/img-part/cloud_b_2.png" alt="" className="banner_shpe banner_shpe_1" />
                                <img src="images/img-part/cloud_b_1.png" alt="" className="banner_shpe banner_shpe_2" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="shape">
                <img src="images/img-part/cloud_2.png" alt="" className="cloud_shpe cloud_shpe_1" />        
                <img src="images/img-part/cloud_3.png" alt="" className="cloud_shpe cloud_shpe_2" />        
                <img src="images/img-part/cloud_1.png" alt="" className="cloud_shpe cloud_shpe_3" />        
                <img src="images/img-part/cloud_2.png" alt="" className="cloud_shpe cloud_shpe_4" />        
                <img src="images/img-part/cloud_1.png" alt="" className="cloud_shpe cloud_shpe_5" />        
                <img src="images/img-part/cloud_3.png" alt="" className="cloud_shpe cloud_shpe_6" />
            </div>
        </header>

        <div className="pricing-section pricing_4 pb-200" id="how-it-works">
            <div className="container">
                <div className="row">
                <div className="col-md-2"></div>		
                <div className="col-md-8">	
                    <div className="bestsite-head text-center pt-100 pb-40">
                        <div className="section-title">
                            <h2>How does it work?</h2>
                        </div>
                        <div className="section-content embed-responsive embed-responsive-16by9">
                            <p>Checkout our video which explains it all.</p>
                            <iframe width="800" height="600" className="pt-20" src="https://www.youtube.com/embed/QSq_Pv65ZLI" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                        </div>
                    </div>
                </div>	
                <div className="col-md-2"></div>	
                </div>
            </div>
        </div>

        <div className="service-section  pb-200" id="price-calculator">
            <div className="container">
                <div className="row">		
                    <div className="offset-md-2 col-md-8">	
                        <div className="bestsite-head text-center pt-200">
                            <div className="section-title">
                                <h2>Profit sharing community</h2>
                            </div>
                            <div className="section-content pb-40">
                                <p>In addition to storing your data and providing FREE access to it forever, we also offer rewards!</p>
                                <p>For every 1GB of data you store will award you with 1500 Evermore 'Tokens' so you can start sharing the usage profits generated by our app</p>
                            </div>
                            <div className="section-title">
                                <h2>What is Evermore Token?</h2>
                            </div>
                            <p>Here's a 1 minute video to show you everthing you need to know...</p>
                            <div className="section-content pt-20 pb-40">
                                <iframe width="800" height="600" src="https://www.youtube.com/embed/gFCzB-b-GVo" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                            </div>
                        </div>
                    </div>	
                    <div className="offset-md-2"></div>	
                </div>
            </div>	
        </div>


        <div className="pricing-section pricing_4 pb-130" id="data-storage">
            <div className="container">
                <div className="row">
                <div className="col-md-2"></div>		
                <div className="col-md-8">	
                    <div className="bestsite-head text-center pt-100 pb-70">
                        <div className="section-title">
                            <h2>Data storage solutions</h2>
                        </div>
                        <div className="section-content">
                            <p>
                                Evermore connects you with cutting edge data storage solutions that allow you to store your data safely and securely online.
                            </p>
                        </div>
                    </div>
                </div>	
                <div className="col-md-2"></div>	
                </div>
                <div className="service-option text-center" id="features">
                    <div className="row">

                        <div className="col-md-4">
                            <div className="service-area">
                                <div className="service-top">
                                    <div className="service-img">
                                        <img src="images/hv3-service-one.png" alt="service image" />
                                    </div>
                                    <div className="service-body">
                                        <h5 className="card-title">Data Security</h5>
                                        <p className="card-text">All your files are encrypted and stored securely online.</p>
                                        <p className="card-text">Evermore will only backup data that you approve and nothing more, giving you protection against ransomeware!</p>
                                    </div>
                                </div>
                            </div>
                            
                        </div>
                        <div className="col-md-4">
                            <div className="service-area">
                                <div className="service-bottom">
                                    <div className="service-img">
                                        <img src="images/hv3-service-five.png" alt="service image" />
                                    </div>
                                    <div className="service-body">
                                        <h5 className="card-title">Blockchain Storage</h5>
                                        <p className="card-text">The data you save will always be available as it is stored on 'The Arweave'. Arweave is a decentralise blockchain specifically designed to store huge amounts of data.</p>
                                        <a target="_blank" href='https://www.arweave.org'>Learn more <i className="fa fa-angle-right"></i></a>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            
                            <div className="service-area">
                                <div className="service-bottom">
                                    <div className="service-img">
                                        <img src="images/hv3-service-four.png" alt="service image" />
                                    </div>
                                    <div className="service-body">
                                        <h5 className="card-title">Safe and Secure</h5>
                                        <p className="card-text">All data is encrypted and can only be decrypted by you using a secure cryptocurrency wallet.</p>
                                        
                                        <a target="_blank" href='https://www.arweave.org'>Learn more <i className="fa fa-angle-right"></i></a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="location-section pb-60" id="network-info">
            <div className="container">
                <div className="row">
                <div className="col-md-2"></div>		
                <div className="col-md-8">	
                    <div className="bestsite-head text-center pt-100 pb-40">
                        <div className="section-title">
                            <h2>Global Blockchain Network</h2>
                        </div>
                        <div className="section-content">
                            <p className="pb-10">All data is encrypted and saved to distributed nodes on the blockchain making your data impossible to delete as its stored in a decentralised way.</p>
                            <p>NOTE: It's important to point out at this point that Evermore is a PERMANENT file storage app which means any data you save to the blockchain is stored forever and can't be deleted or censored.</p>
                        </div>
                    </div>
                </div>	
                <div className="col-md-2"></div>	
                </div>
                <div className="location-map">
                    <img src="images/country-map.png" alt="" />
                </div>
            </div>
        </div>
        


        <div className="cloud-hosting spreed_top_1 pt-120 pb-200" id="desktop-app">
            <div className="container">
                <div className="row">
                    <div className="col-md-5">
                        <div className="cloud-content">
                            <h2>Desktop integration</h2>
                            <p><Link to="/downloads" style={{display: "inline-block"}}>Download</Link> one of our desktop apps to begin saving your data to the blockchain.</p>
                            <p>Your data is stored on the "PermaWeb" which means it can never be deleted or taken down.</p>
                            <p>In addition, we keep a full version history so that your can always get you hands on older versions of your data at any point</p>
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
                            <p>As the need for reliable data storage grows; so will the need for a secure, permanent, and cost-effective data storage solution. At Evermore, we provide the framework to make this solution a reality. </p>
                        </div>
                    </div>
                    <div className="col-12 col-md-6 col-lg-3">
                        <div className="footer-link">
                            <h3>Quick Link</h3>
                            <ul>
                                <li><a href="#" onClick={e => {this.executeScroll(e, "intro")}}>Evermore</a></li>
                                <li><a href="#" onClick={e => {this.executeScroll(e, "data-storage")}}>Data storage solutions</a></li>
                                <li><a href="#" onClick={e => {this.executeScroll(e, "price-calculator")}}>Pricing Calculator</a></li>
                                <li><a href="#" onClick={e => {this.executeScroll(e, "network-info")}}>Global Blockchain Network</a></li>
                                <li><a href="#" onClick={e => {this.executeScroll(e, "desktop-app")}}>Software</a></li>
                                
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



        <section id="scroll-top" className="scroll-top">
            <h2 className="disabled">&nbsp;</h2>
            <div className="to-top pos-rtive">
                <a href="#" onClick={e => {this.executeScroll(e, "intro")}}><i className= "fa fa-arrow-up"></i></a>
            </div>
        </section>
        </>)
    }
}

export default HomePage;