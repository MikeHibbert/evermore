
import React, {Component} from 'react';
import arweave from '../../arweave-config';
import { Link } from 'react-router-dom';
import Moment from 'react-moment';
import NFTThumbnail from './NFTThumbnail';
const dJSON = require('dirty-json');

const escapeText = function (str) {
    return str
        .replace(/[\\]/g, '')
        .replace(/[\/]/g, '')
        .replace(/[\b]/g, '')
        .replace(/[\f]/g, '')
        .replace(/[\n]/g, '')
        .replace(/[\r]/g, '')
        .replace(/[\t]/g, '')
        .replace(/"[^"]*""/g, '"');
};

class NFTs extends Component {
    state = {
        nfts: [],
        search: null,
        loading: true, 
        cursor: null,
        hasNextPage: false
    }

    constructor(props) {
        super(props);

        this.seeMore.bind(this);
        this.executeScroll.bind(this);
    }

    componentDidMount() {
        document.body.classList.add('home-version-four');
        document.body.id = "home-version-four";
        const that = this;
        this.getNFTSearch(null).then(nft_results => {
            that.setState({nfts: nft_results.nfts, cursor: nft_results.cursor, hasNextPage: nft_results.hasNextPage, loading: false});
        });
    }

    onSearch(e) {
        const search = e.target.value;
        this.setState({search: search, loading: true});

        const that = this;

        this.getNFTSearch(search).then(nft_results => {
            that.setState({nfts: nft_results.nfts, cursor: nft_results.cursor, hasNextPage: nft_results.hasNextPage, loading: false});
        });
    }

    async queryForNFTs(firstPage, cursor) {
        try {
            const query = {
              query: `query {
              transactions(
                sort: HEIGHT_DESC
                tags: [{ name: "Application", values: ["Evermore"]}, {name: "App-Name", values:["SmartWeaveContract"]}]
                first: 100
                after: "${cursor}"
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

    async getNFTSearch(search, cursor="") {
        let completed = false;
        let nfts = [];
        let firstPage = 2147483647; // Max size of query for GQL
        let timeStamp = new Date();
        let yesterday = new Date(timeStamp);
        yesterday.setDate(yesterday.getDate() - 6);

        // Create the query to search for all ardrive transactions.
        let transactions = await this.queryForNFTs(firstPage, cursor);
        
        const { edges } = transactions;

        let last_cursor = cursor;
        edges.forEach((edge) => {
            last_cursor = edge.cursor;
            const { node } = edge;
            const { data } = node;
            const { owner } = node;
            const { block } = node;
            if (block !== null) {
                let timeStamp = new Date(block.timestamp * 1000);

                if (yesterday.getTime() <= timeStamp.getTime()) {
                    if(search) {
                        console.log(node);
                        debugger;
                    } else {
                        nfts.push(node);
                    }                        
                } else {
                    // The blocks are too old, and we dont care about them
                    completed = true;
                }
            }
        });

        
        for(let i in nfts) {
            const nft = nfts[i];
            const tags = {};
           
            for(let j in nft.tags) {
                const tag = nft.tags[j];
                if(tag.name == 'Init-State') {
                    try {
                        
                        tags[tag.name] = dJSON.parse(tag.value);
                    } catch (e) {
                        const parts = tag.value.split(':')
                        debugger;
                    }
                    
                } else {
                    tags[tag.name] = tag.value;
                }
            }
            
            nft['processed_tags'] = tags;
        }

        return {nfts:nfts, cursor: last_cursor, hasNextPage: transactions.pageInfo.hasNextPage};
    }

    seeMore(e) {
        e.preventDefault();

        const that = this;
        this.getNFTSearch(null, this.state.cursor).then(nft_results => {
            that.setState({nfts: nft_results.nfts, cursor: nft_results.cursor, hasNextPage: nft_results.hasNextPage, loading: false});
        });
    }

    executeScroll(e, elem_id) {
        e.preventDefault();

        window.scrollTo({
            behavior: "smooth",
            top: document.getElementById(elem_id).getBoundingClientRect().top - document.body.getBoundingClientRect().top
        });
    }
    
    render() {
        const nfts = this.state.nfts.map(nft => {
            return <NFTThumbnail 
                key={nft.id}
                nft={nft}
            />;
        });

        let spinner = <img style={{height: '320px'}} src="images/spinner-dark.svg" />;
        if(!this.state.loading) {
            spinner = null;
        }

        let seeMoreSection = null;
        let nextMoreSection = null;
        if(this.state.hasNextPage) {

            seeMoreSection = <div class=" col-12 col-md-12 col-lg-12 d-flex justify-content-center">
                                <a onClick={(e) => this.seeMore(e)} title="" class="view-more-btn g-btn">See More</a>
                            </div>;

            nextMoreSection = <div class=" col-12 col-md-12 col-lg-12 d-flex justify-content-center mb-30">
                                    <a onClick={(e) => this.seeMore(e)} title="" class="view-more-btn g-btn">Next Page</a>
                                </div>;
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

        <div className="service-section teachers_2 pb-200" id="price-calculator">
            <div className="container">
                <div className="row">       
                    {/* <div className=" col-md-8">  
                        <div class="search-banner pr-30 pb-70 pt-40">
                            <input class="form-control search-inner" type="text" placeholder="Search your domain here" />			
                            <div class="search-submit">
                                <input type="submit" className="btn btn-default" value="Search" />
                            </div>
                        </div>
                    </div>   */}
                    <div className="offset-md-2"></div> 
                    <div className="row">		
                        {spinner}

     
                        {nfts}

                        {seeMoreSection}
                        <div className="offset-md-2"></div>	
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

export default NFTs;