
import React, { Component } from 'react';
import arweave from '../../arweave-config';
import settings from '../../app-config';
import { readContract } from 'smartweave';
import { Link } from 'react-router-dom';
import Moment from 'react-moment';
import NFTThumbnail from './NFTThumbnail';
import { act } from 'react-dom/test-utils';
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
        const id = this.props.location.pathname.split('/')[2];

        document.body.classList.add('home-version-four');
        document.body.id = "home-version-four";
        const that = this;
        this.getNFTSearch(id).then(nft_results => {
            that.setState({ nfts: nft_results.nfts, cursor: nft_results.cursor, hasNextPage: nft_results.hasNextPage, loading: false });
        });
    }

    onSearch(e) {
        const search = e.target.value;
        this.setState({ search: search, loading: true });

        const that = this;

        this.getNFTSearch(search).then(nft_results => {
            that.setState({ nfts: nft_results.nfts, cursor: nft_results.cursor, hasNextPage: nft_results.hasNextPage, loading: false });
        });
    }

    async queryForNFTs(wallet_address, firstPage, cursor) {
        try {
            const query = {
                query: `query {
              transactions(
                owners:["${wallet_address}"]
                sort: HEIGHT_DESC
                tags: [
                    {
                        name: "Application",
                        values: ["Evermore"]
                    },
                    {
                        name: "App-Name",
                        values: ["SmartWeaveContract", "SmartWeaveAction"]
                    }
                ]
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
            console.log(err);
            console.log("uh oh cant query");
        }
    }

    getNFTSearch(id, cursor = "") {
        return new Promise(async (resolve, reject) => {

            const transactions = {};

            const folders = { "": { children: [] } };
            folders[""] = {
                name: "", children: [
                    { name: "NFTs", children: [], index: 0, type: "folder" }
                ], index: 0, type: "folder"
            };

            let { promises, hasNextPage, cursor } = await getSmartContractNFTs(id);

            resolve(Promise.allSettled(promises).catch(errors => {
                console.log(errors);
            }));
        }).then(transactions_results => {

            const transactions = {};
            transactions_results.forEach(result => {
                if (result.status == 'fulfilled') {
                    transactions[result.value.id] = result.value;
                }
            });

            return transactions;

        }).then(async transactions => {
            const results = await getSmartContractTransfers(id);

            const not_owned = await Promise.allSettled(results.promises).catch(e => {
                console.log(e);
            });

            not_owned.forEach(action => {
                if (action.status == 'fulfilled' && action.value != undefined) {
                    if (action.value.state.balances[id] == 0) {
                        delete transactions[action.value.Contract];
                    }
                }
            });

            return { transactions: transactions, hasNextPage: results.hasNextPage, cursor: results.cursor }

        }).then(results => {
            const nfts = [];

            Object.keys(results.transactions).forEach(file_name => {
                const available_row = results.transactions[file_name];

                nfts.push(available_row);
            });

            return ({ nfts: nfts, hasNextPage: results.hasNextPage, cursor: results.cursor });
        });
    }

    seeMore(e) {
        e.preventDefault();

        const that = this;
        this.getNFTSearch(null, this.state.cursor).then(nft_results => {
            that.setState({ nfts: nft_results.nfts, cursor: nft_results.cursor, hasNextPage: nft_results.hasNextPage, loading: false });
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

        let spinner = <img style={{ height: '320px' }} src="images/spinner-dark.svg" />;
        if (!this.state.loading) {
            spinner = null;
        }

        let seeMoreSection = null;
        let nextMoreSection = null;
        if (this.state.hasNextPage) {

            seeMoreSection = <div className=" col-12 col-md-12 col-lg-12 d-flex justify-content-center">
                <a onClick={(e) => this.seeMore(e)} title="" className="view-more-btn g-btn">See More</a>
            </div>;

            nextMoreSection = <div className=" col-12 col-md-12 col-lg-12 d-flex justify-content-center mb-30">
                <a onClick={(e) => this.seeMore(e)} title="" className="view-more-btn g-btn">Next Page</a>
            </div>;
        }

        return (<>
            <link rel="stylesheet" href="css/style.css"></link>
            <link rel="stylesheet" href="css/responsive.css"></link>
            <link rel="stylesheet" href="css/master.css"></link>
            <header className="banner-area collapsed-banner" style={{ minHeight: '0px !important' }} id="intro">

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
                                            { /* <li><Link to='support'><i className="fa fa-headphones header-top-icon"></i>support</Link></li> */}
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
                                        <li className="nav-item p-nav">{<Link to='/downloads' className="nav-link nav-menu">Downloads</Link>}</li>
                                        { /* <li className="nav-item p-nav"><a href="/contact" className="nav-link nav-menu">Contact</a></li> */}
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
                        <div className="search-banner pr-30 pb-70 pt-40">
                            <input className="form-control search-inner" type="text" placeholder="Search your domain here" />			
                            <div className="search-submit">
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
                    <a href="#" onClick={e => { this.executeScroll(e, "intro") }}><i className="fa fa-arrow-up"></i></a>
                </div>
            </section>
        </>)
    }
}

export default NFTs;

async function getSmartContractTransfers(id) {
    let hasNextPage = true;
    let cursor = '';
    const promises = [];
    while (hasNextPage) {
        const query = `{
                    transactions(
                        first: 100
                        owners: ["${id}"]
                        tags: [
                        {
                            name: "Application",
                            values: ["Evermore"]
                        },
                        {
                            name: "App-Name",
                            values: ["SmartWeaveAction"]
                        }
                        ]
                        after: "${cursor}"
                        ) {
                        pageInfo {
                            hasNextPage
                        }
                        edges {
                            cursor
                            node {
                                id
                                tags {
                                    name
                                    value
                                }
                            }
                        }
                        
                    }
                }`;

        const response = await arweave.api.request().post(settings.GRAPHQL_ENDPOINT, {
            operationName: null,
            query: query,
            variables: {}
        });


        if (response.status == 200) {

            const data = response.data.data;

            data.transactions.edges.forEach(edge => {
                const promise = new Promise((resolve, reject) => {
                    const row = edge.node;

                    row['tx_id'] = row.id;

                    const processed_tags = {};

                    row.tags.forEach(tag => {


                        if (tag.name == 'version' || tag.name == 'modified' || tag.name == 'created' || tag.name == 'key_size') {
                            processed_tags[tag.name] = parseInt(tag.value);
                            if (tag.name == 'modified') {
                                processed_tags['created'] = row['modified'];
                            }
                        } else {
                            processed_tags[tag.name] = tag.value;
                            if (tag.name == 'Init-State') {
                                processed_tags[tag.name] = dJSON.parse(tag.value);
                            }
                        }
                    });

                    row['processed_tags'] = processed_tags;


                    if (row.processed_tags['Action'] == 'Transfer') {
                        resolve(
                            readContract(arweave, row.processed_tags.Contract).then(state => {
                                if (!state.balances.hasOwnProperty(id)) {
                                    return reject();
                                }
                                if (state.balances[id] != 0) {
                                    row['state'] = state;

                                    return arweave.transactions.get(row.id).then(tx => {

                                        tx.get('tags').forEach(tag => {
                                            let key = tag.get('name', { decode: true, string: true });
                                            let value = tag.get('value', { decode: true, string: true });

                                            if (key == "modified" || key == "version" || key == "file_size") {
                                                row[key] = parseInt(value);
                                            } else {
                                                row[key] = value;
                                            }

                                        });

                                        return row;
                                    }).catch(e => {
                                        console.log(e);
                                        return reject(e);
                                    });
                                }
                            })
                        );


                    } else {
                        return reject();
                    }
                });

                promises.push(promise);
            });

            hasNextPage = data.transactions.pageInfo.hasNextPage;

            if (hasNextPage) {
                cursor = data.transactions.edges[data.transactions.edges.length - 1].cursor;
            }
        }
    }

    return { promises, hasNextPage, cursor };
}

async function getSmartContractNFTs(id) {
    let hasNextPage = true;
    let cursor = '';
    const promises = [];
    while (hasNextPage) {
        const query = `{
                    transactions(
                        first: 100
                        owners: ["${id}"]
                        tags: [
                        {
                            name: "Application",
                            values: ["Evermore"]
                        },
                        {
                            name: "App-Name",
                            values: ["SmartWeaveContract"]
                        }
                        ]
                        after: "${cursor}"
                        ) {
                        pageInfo {
                            hasNextPage
                        }
                        edges {
                            cursor
                            node {
                                id
                                tags {
                                    name
                                    value
                                }
                            }
                        }
                        
                    }
                }`;

        const response = await arweave.api.request().post(settings.GRAPHQL_ENDPOINT, {
            operationName: null,
            query: query,
            variables: {}
        });


        if (response.status == 200) {

            const data = response.data.data;

            data.transactions.edges.forEach(edge => {
                const promise = new Promise((resolve, reject) => {
                    const row = edge.node;

                    row['tx_id'] = row.id;

                    const processed_tags = {};

                    row.tags.forEach(tag => {


                        if (tag.name == 'version' || tag.name == 'modified' || tag.name == 'created' || tag.name == 'key_size') {
                            processed_tags[tag.name] = parseInt(tag.value);
                            if (tag.name == 'modified') {
                                processed_tags['created'] = row['modified'];
                            }
                        } else {
                            processed_tags[tag.name] = tag.value;
                            if (tag.name == 'Init-State') {
                                processed_tags[tag.name] = dJSON.parse(tag.value);
                            }
                        }
                    });

                    row['processed_tags'] = processed_tags;

                    if (row.processed_tags['App-Name'] == "SmartWeaveContract" || row.processed_tags['App-Name'] == "SmartWeaveAction") {

                        if (row.processed_tags['App-Name'] == "SmartWeaveContract") {

                            return readContract(arweave, row.id).then(state => {
                                if (!state.balances.hasOwnProperty(id)) {
                                    return reject();
                                }
                                if (state.balances[id] != 0) {
                                    return resolve(row);
                                }
                            }).catch(e => {
                                return reject(e);
                            });

                        } else {
                            if (row.processed_tags['Action'] == 'Transfer') {
                                return readContract(arweave, row.processed_tags.Contract).then(state => {
                                    if (!state.balances.hasOwnProperty(id)) {
                                        return reject();
                                    }
                                    if (state.balances[id] != 0) {

                                        resolve(arweave.transactions.get(row.processed_tags.Contract).then(tx => {

                                            tx.get('tags').forEach(tag => {
                                                let key = tag.get('name', { decode: true, string: true });
                                                let value = tag.get('value', { decode: true, string: true });

                                                if (key == "modified" || key == "version" || key == "file_size") {
                                                    row[key] = parseInt(value);
                                                } else {
                                                    row[key] = value;
                                                }

                                            });

                                            return row;
                                        }).catch(e => {
                                            debugger;
                                            console.log(e);
                                            return reject(e);
                                        }));
                                    }
                                }).catch(e => {
                                    return reject(e);
                                });;


                            } else {
                                return reject();
                            }
                        }
                    }
                });

                promises.push(promise);
            });

            hasNextPage = data.transactions.pageInfo.hasNextPage;

            if (hasNextPage) {
                cursor = data.transactions.edges[data.transactions.edges.length - 1].cursor;
            }


        }


    }
    return { promises, hasNextPage, cursor };
}
