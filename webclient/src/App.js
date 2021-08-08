import { Helmet } from 'react-helmet';
import React, { Component } from 'react';
import { Route, Redirect, withRouter } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import PageHeader from './components/PageHeader/PageHeader';
import Menu from './components/MainMenu/Menu';
import Login from './components/auth/Login';
import Logout from './components/auth/Logout';
import RecentActivity from './containers/Files/RecentActivity';
import FoldersView from './containers/Files/Folders';
import FileDetail from './containers/Files/FileDetail';
import DeletedView from './containers/Files/Deleted';
import SearchPage from './containers/Search/SearchPage';
import HomePage from './containers/Home/Hompage';
import Downloads from './containers/Home/Downloads';
import NFTs from './containers/NFT/NFTs';
import NFTDetail from './containers/NFT/NFTDetail';
import settings from './app-config';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import ReactGA from 'react-ga';
import MergeNFT from './containers/NFT/MergeNFT';


const trackingId = "G-YSH82SBB2L"; // Replace with your Google Analytics tracking ID
ReactGA.initialize(trackingId, { debug: true });
ReactGA.set({
  userId: sessionStorage.getItem('ETH_Wallet', null),
  // any data that is relevant to the user session
  // that you would like to track with google analytics
});

class App extends Component {
  state = {
    isAuthenticated: null,
    contentToggled: false,
    contentStyle: { marginLeft: '0px' },
    balance: 0,
    evermore_balance: 0,
    wallet_address: null,
    aside_classes: "aside-start aside-primary font-weight-light aside-hide-xs d-flex flex-column h-auto",
    aside_open: false,
    files: null,
    persistence_records: null,
    sent_messages: [],
    pending_messages: [],
    new_email_count: 0,
    transactions_to_be_mined: []
  }

  interval = null;

  constructor(props) {
    super(props);

    this.toggleAside.bind(this);
    this.addErrorAlert.bind(this);
    this.addSuccessAlert.bind(this);
    this.setMessages.bind(this);
    this.clearNewEmailCount.bind(this);
    this.addToTransactionsToBeMined.bind(this);
    this.removeFromTransactionsToBeMined.bind(this);
  }

  componentDidMount() {
    const wallet_address = sessionStorage.getItem('ETH_Wallet', null);

    const isAuthenticated = sessionStorage.getItem('isAuthenticated');

    this.setState({ isAuthenticated: isAuthenticated === 'true' ? true : false, wallet_address: wallet_address});

    if (isAuthenticated) {
      
    }

    this.props.history.listen(location => {
      ReactGA.set({ page: location.pathname }); // Update the user's current page
      ReactGA.pageview(location.pathname); // Record a pageview for the given page
    });
  }

  componentDidUpdate(prevProps) {
    if (this.props.isAuthenticated !== undefined && this.props.isAuthenticated !== prevProps.isAuthenticated) {
      this.setState({ isAuthenticated: this.props.isAuthenticated });

      if (this.props.isAuthenticated && !this.props.expand_content_area) {
        this.setState({ contentStyle: { marginLeft: '0px' } });
      }


    }
  }

  componentWillUnmount() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  newMessages(messages) {
    const new_messages = [];

    for (let i in messages) {
      const message = messages[i];

      const old_message = this.state.messages.find((msg) => msg.id == message.id);

      if (!old_message) {
        new_messages.push(message)
      }
    }

    return new_messages;
  }

  setWalletAddress(wallet_address) {
    this.resetContentArea();
    sessionStorage.setItem('ETH_Wallet', wallet_address);
    sessionStorage.setItem('isAuthenticated', true);
  }

  addSuccessAlert(message) {
    toast(message, { type: toast.TYPE.SUCCESS });
  }

  addErrorAlert(message) {
    toast(message, { type: toast.TYPE.ERROR });
  }

  addToTransactionsToBeMined(transaction_record) {
    debugger;
    const transactions_to_be_mined = [...this.state.transactions_to_be_mined];

    const matches = transactions_to_be_mined.filter(tx => tx.id != transaction_record.id);

    if (matches.length == 0) {
      transactions_to_be_mined.push(transaction_record);
    }

    this.setState({ transactions_to_be_mined: transactions_to_be_mined });
  }

  removeFromTransactionsToBeMined(transaction_id) {
    const transactions_to_be_mined = this.state.transactions_to_be_mined.filter(tx => tx.id != transaction_id);
    this.setState({ transactions_to_be_mined: transactions_to_be_mined });
  }

  disconnectWallet() {
    sessionStorage.removeItem('ETH_Wallet');
    sessionStorage.removeItem('isAuthenticated');

    console.log('disconnectWallet')
    this.setState({ isAuthenticated: false, wallet_address: null, jwk: null, balance: 0 });

    this.addSuccessAlert("Your wallet is now disconnected");
  }

  toggleAside() {
    console.log('toggleAside')
    if (this.state.aside_open) {
      this.setState({
        aside_classes: "aside-start aside-primary font-weight-light aside-hide-xs d-flex flex-column h-auto",
        aside_open: false
      });
    } else {
      this.setState({
        aside_classes: "aside-start aside-primary font-weight-light aside-hide-xs d-flex flex-column h-auto js-aside-show",
        aside_open: true
      })
    }
  }

  resetContentArea() {
    document.body.classList.add('layout-admin');
    document.body.classList.add('aside-sticky');
    document.body.classList.add('header-sticky');
  }

  expandContentArea() {
    document.body.classList.remove('layout-admin');
    document.body.classList.remove('aside-sticky');
    document.body.classList.remove('header-sticky');
  }

  setMessages(messages) {
    this.setState({ messages: messages });
  }

  clearNewEmailCount() {
    this.setState({ new_email_count: 0 });
  }

  render() {
    let header = (

      <header id="header">
        <PageHeader
          isAuthenticated={this.state.isAuthenticated}
          history={this.props.history}
          current_balance={this.state.balance}
          evermore_balance={this.state.evermore_balance}
          wallet_address={this.state.wallet_address}
          username={this.state.username}
          toggleAside={() => this.toggleAside()}
          new_email_count={this.state.new_email_count}
          clearNewEmailCount={() => { this.clearNewEmailCount() }}
          pending_messages={this.state.pending_messages}
        />
      </header>
    );

    let side_menu = (<aside id="aside-main" className={this.state.aside_classes}>
      <Menu {...this.props} toggleAside={() => this.toggleAside()} pending_messages={this.state.pending_messages} />
    </aside>);

    let routes = [
      <Route key='home' path="/" exact component={() => <RecentActivity files={this.state.files} wallet_address={this.state.wallet_address} jwk={this.state.jwk} />} />,
      <Route key='nfts' path="/nfts/:id" exact component={() => <NFTs wallet_address={this.state.wallet_address} location={this.props.location} jwk={this.state.jwk} />} />,
      <Route key='files' path="/files" exact component={() => <FoldersView
        location={this.props.location}
        files={this.state.files}
        wallet_address={this.state.wallet_address}
        wallet_balance={this.state.balance}
        jwk={this.state.jwk}
        addToTransactionsToBeMined={(transaction_record) => { this.addToTransactionsToBeMined(transaction_record) }}
        removeFromTransactionsToBeMined={(tx_id) => { this.removeFromTransactionsToBeMined(tx_id) }}
        transactions_to_be_mined={this.state.transactions_to_be_mined}
        addSuccessAlert={this.addSuccessAlert}
        addErrorAlert={this.addErrorAlert} />} />,
      <Route key='file' path='/file/:id' component={() => <FileDetail
        match={this.props.match}
        location={this.props.location}
        history={this.props.history}
        files={this.state.files}
        wallet_address={this.state.wallet_address}
        wallet_balance={this.state.balance}
        jwk={this.state.jwk}
        addSuccessAlert={this.addSuccessAlert}
        addErrorAlert={this.addErrorAlert}
      />} />,
      <Route key='merge' path='/merge' exact component={() => <MergeNFT wallet_address={this.state.wallet_address} jwk={this.state.jwk} files={this.state.files} />} />,
      <Route key='archived' path="/archived" exact component={() => <DeletedView persistence_records={this.state.persistence_records} wallet_address={this.state.wallet_address} jwk={this.state.jwk} />} />,
      <Route key='search' path="/search" exact component={() => <SearchPage wallet_address={this.state.wallet_address} jwk={this.state.jwk} />} />,
      <Route key='logout' path="/logout" exact component={() => <Logout onLogout={this.disconnectWallet.bind(this)} addSuccessAlert={this.addSuccessAlert} expandContentArea={() => { this.expandContentArea() }} />} />
    ];

    let page_content = <div id="wrapper" className="d-flex align-items-stretch flex-column">
      <ToastContainer />
      {header}
      <div id="wrapper_content" className="d-flex flex-fill">
        {side_menu}
        <div id="middle" className="flex-fill">
          {routes}
        </div>
      </div>
    </div>;



    if (this.state.isAuthenticated == false) {
      routes = [
        <Route key='home' path="/" exact component={() => <HomePage wallet_address={this.state.wallet_address} jwk={this.state.jwk} />} />,
        <Route key='nfts' path="/nfts/:id" exact component={() => <NFTs wallet_address={this.state.wallet_address} location={this.props.location} jwk={this.state.jwk} />} />,
        <Route key='nft-detail' path="/nft-detail/:id" exact component={() => <NFTDetail
          location={this.props.location}
          wallet_address={this.state.wallet_address}
          addSuccessAlert={this.addSuccessAlert}
          jwk={this.state.jwk} />} />,
        <Route key='downloads' path="/downloads" exact component={() => <Downloads wallet_address={this.state.wallet_address} jwk={this.state.jwk} />} />,
        <Route key='login' path="/login" exact component={() => <Login expandContentArea={() => { this.expandContentArea() }} setWalletAddress={this.setWalletAddress.bind(this)} />} />,
      ];

      header = null;
      side_menu = null;

      page_content = <>
        <ToastContainer />
        {routes}
      </>;

    } else {
      this.resetContentArea();
    }

    if (this.state.isAuthenticated && this.props.location.pathname === '/login') {
      routes.push(<Redirect to='/files' />);
    }

    console.log('Render App')
    return (<>
      <Helmet>
        <title>Evermore - Your data in the blockchain ... Forever</title>
        <link rel="canonical" href="https://evermoredata.store" />
        <meta
          name="description"
          content="Evermore - Your data in the blockchain, online file storage, FREE access to your data without any subscriptions"
        />
      </Helmet>
      {page_content}
    </>
    );
  }

}

export default withRouter(App);
