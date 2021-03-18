import React, {Component} from 'react';
import { Link } from 'react-router-dom';
import Moment from 'react-moment';
import arweave from '../../arweave-config';
import { render } from '@testing-library/react';
import {getContentElementBasedOnType} from './NFTThumbnail';
const dJSON = require('dirty-json');

export default class NFTDetail extends Component {
    state = {
        nft: null
    }

    async getNFT(id) {
        try {
            const query = {
              query: `query {
              transactions(
                ids: ["${id}"]
              ) {
                pageInfo {
                  hasNextPage
                }
                edges {
                  cursor
                  node {
                    owner {
                      address
                    }
                    id
                    tags {
                        name
                        value
                    }
                    data {
                      size
                    }
                    block {
                      timestamp
                    }
                  }
                }
              }
            }`,
            };
 
            const response = await arweave.api.request().post('https://arweave.net/graphql', query);
            const { data } = response.data;
            const { transactions } = data;
            return transactions;
        } catch (err) {
            debugger;
            console.log (err);
            console.log ("uh oh cant query");
        }
    }

    componentDidMount() {
        document.body.classList.add('home-version-four');
        document.body.id = "home-version-four";

        const that = this;

        if(this.props.location.hasOwnProperty('nft')) {
            this.setState({nft: this.props.location.nft});
        } else {
            const id = this.props.location.pathname.split('/')[2];
            const processed_tags = {};
            this.getNFT(id).then(transaction => {
                const edge = transaction.edges[0];
                const nft = edge.node;

                for(let i in nft.tags) {
                    const tag = nft.tags[i];
                    if(tag.name == 'Init-State') {
                        processed_tags[tag.name] = dJSON.parse(tag.value);
                    } else {
                        processed_tags[tag.name] = tag.value;
                    }
                }

                nft['processed_tags'] = processed_tags;
                that.setState({nft: nft});
            }) 
        }
    }

    render() {

        let nft_detail = null;
        let owner = null;

        if(this.state.nft) {
            const contentElement = getContentElementBasedOnType(this.state.nft, this.state.nft.processed_tags['Init-State'], "100%", "100%")
            const name = this.state.nft.processed_tags['Init-State'].name;
            const description = this.state.nft.processed_tags['Init-State'].description.replace('- Created with Evermore', '');
            debugger;
            nft_detail = <div className="col-12 col-sm-12 col-md-8 col-lg-8">
                            <div className="single_blog">
                                <div className="blog_banner">
                                {contentElement}
                                </div>
                                <div className="blog_content pt-20">
                                    <h3>{name}</h3>
                                    <p>{description}</p>

                                    <div className="page_info pt-20">
                                        <ul className="post_view_comment">
                                            <li><i className="flaticon-calendar"><Moment data={this.state.nft.processed_tags.created} format="ddd MMM YYYY HH:mm:ss"></Moment></i></li>
                                        </ul>
                                        <div className="share">
                                            <i className="flaticon-share"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>      
                        </div>    
                        
            owner = this.state.nft.owner.address;
                        
        }

        return (<>
            <link rel="stylesheet" href="css/style.css"></link>
                <link rel="stylesheet" href="css/responsive.css"></link>
                <link rel="stylesheet" href="css/master.css"></link>
                <header className="banner-area collapsed-banner" style={{minHeight: '0px !important'}}id="intro">

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

            </header>

            <div className="service-pricing teachers_2 pb-200" id="price-calculator">
                <div className="container">
                <div className="row">   
                    {nft_detail}

                    <div className="col-12 col-sm-12 col-md-4 col-lg-4 blog_wrapper_right ">
                        <div className="blog-right-items">

                            <div className="follow_us widget_single">
                                <div className="items-title">
                                    <h3 className="title">Owner</h3>
                                </div>
                                <div className="tags-items">
                                    <p>{owner}</p>
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
                                    <li><Link to='/'>Evermore</Link></li>
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