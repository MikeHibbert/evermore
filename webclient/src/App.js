import React, {Component} from 'react';
import { Route, Redirect, withRouter } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import PageHeader from './components/PageHeader/PageHeader';
import Menu from './components/MainMenu/Menu';
import Login from './components/auth/Login';
import Logout from './components/auth/Logout';
import RecentActivity from './containers/Files/RecentActivity';
import FoldersView from './containers/Files/Folders';
import SearchPage from './containers/Search/SearchPage';
import HomePage from './containers/Home/Hompage';
import Downloads from './containers/Home/Downloads';
import {getFiles} from './containers/Files/helpers';
import {getName} from './components/Message/helpers';
import arweave from './arweave-config';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

class App extends Component {
  state = {
    isAuthenticated: null,
    contentToggled: false,
    contentStyle: {marginLeft: '0px'},
    balance: 0,
    wallet_address: null,
    aside_classes: "aside-start aside-primary font-weight-light aside-hide-xs d-flex flex-column h-auto",
    aside_open: false,
    files: null,
    sent_messages: [],
    pending_messages: [],
    new_email_count: 0
  }

  interval = null;

  constructor(props) {
    super(props);

    this.toggleAside.bind(this);
    this.addErrorAlert.bind(this);
    this.addSuccessAlert.bind(this);
    this.setMessages.bind(this);
    this.clearNewEmailCount.bind(this);
  } 

  componentDidMount() {
    const wallet_address = sessionStorage.getItem('AR_Wallet', null);
    const jwk = JSON.parse(sessionStorage.getItem('AR_jwk', null));  
    
    if(jwk !== null) {
      this.setState({isAuthenticated: true, wallet_address: wallet_address, jwk: jwk});
      this.loadWallet(wallet_address);
    }

    const isAuthenticated = sessionStorage.getItem('isAuthenticated');

    this.setState({isAuthenticated: isAuthenticated === 'true' ? true : false});

    
    if(this.props.isAuthenticated == undefined) {
      return;
    }

    const that = this;
    
    debugger;
    
    // this.interval = setInterval(async function() {
    //   debugger;
    //   await checkPendingMessages();
    //   const messages = await getMessages();
        
    //   if(messages.length > this.state.messages.length && this.state.messages.length > 0) {
    //     const new_count = messages.length - this.state.messages.length;
    //     this.setState({new_email_count: new_count});
    //     this.addSuccessAlert("You have " + new_count + " new messages");
    //   } 

    //   const sent_messages = await getSentMessages();
      
    //   const pending_messages = getPendingMessages();

    //   that.setState({messages: messages, sent_messages: sent_messages, pending_messages: pending_messages});         
        
    // }, 10 * 1000);
  }

  componentDidUpdate(prevProps) {
    if(this.props.isAuthenticated !== undefined && this.props.isAuthenticated !== prevProps.isAuthenticated) {
      this.setState({isAuthenticated: this.props.isAuthenticated});

      if(this.props.isAuthenticated && !this.props.expand_content_area) {
        this.setState({contentStyle: {marginLeft: '0px'}});
      }
    }
  }

  componentWillUnmount() {
    if(this.interval) {
      clearInterval(this.interval);
    }
  }

  async loadWallet(wallet_address) {
    const that = this;

    if(wallet_address) {
        arweave.wallets.getBalance(wallet_address).then((balance) => {
            let ar = arweave.ar.winstonToAr(balance);

            const state = {balance: ar};

            that.setState(state);
        }); 

        const files = await getFiles(wallet_address);
        
        // if(files.childeren.length > this.state.files.length && this.state.files.length > 0) {
        //   const new_count = files.length - this.state.files.length;
        //   this.setState({new_files_count: new_count});
        //   this.addSuccessAlert("You have " + new_count + " new files");
        // } 
       
        // const pending_files = getPendingFiles();
        
        that.setState({files: files});             

        getName(wallet_address).then((username) => {
          that.setState({username: username});
        });
    }     
  }

  newMessages(messages) {
    const new_messages = [];

    for(let i in messages) {
      const message = messages[i];

      const old_message = this.state.messages.find((msg) => msg.id == message.id);

      if(!old_message) {
        new_messages.push(message)
      }
    }

    return new_messages;
  }

  getFiles() {
    const that = this;

    const pending_messages = getFiles().then(files => {
      that.setState({files: files}); 
    });
     
  }

  setWalletAddress(wallet_address_files) {
      const that = this;

      const reader = new FileReader();
      reader.onload = function() {
          const text = reader.result;
          const jwk = JSON.parse(text);

          arweave.wallets.jwkToAddress(jwk).then((wallet_address) => {                
              that.setState({wallet_address: wallet_address, jwk: jwk});
              sessionStorage.setItem('AR_Wallet', wallet_address);
              sessionStorage.setItem('AR_jwk', JSON.stringify(jwk));
          
              that.loadWallet(wallet_address);

              that.setState({isAuthenticated: true});
              sessionStorage.setItem('isAuthenticated', true);
              that.resetContentArea();
              that.addSuccessAlert("You have successfully connected.");
          });
          
      }
      reader.readAsText(wallet_address_files[0]);

  }

  addSuccessAlert(message)  {
    toast(message, { type: toast.TYPE.SUCCESS });     
  }

  addErrorAlert(message) {
    toast(message, { type: toast.TYPE.ERROR });  
  }

  disconnectWallet() {
      sessionStorage.removeItem('AR_Wallet');
      sessionStorage.removeItem('AR_jwk');
      sessionStorage.removeItem('isAuthenticated');
      sessionStorage.removeItem('exchange');
      sessionStorage.removeItem('coinpair');

      this.setState({isAuthenticated: false, wallet_address: null, jwk: null, balance: 0});

      this.addSuccessAlert("Your wallet is now disconnected");
  }

  toggleAside() {
    if(this.state.aside_open) {
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
    this.setState({messages: messages});
    debugger;
  }

  clearNewEmailCount() {
    this.setState({new_email_count: 0});
  }

  render() {
    let header = (
    
      <header id="header">
        <PageHeader 
          isAuthenticated={this.state.isAuthenticated} 
          history={this.props.history} 
          current_balance={this.state.balance}
          wallet_address={this.state.wallet_address}
          username={this.state.username}
          toggleAside={() => this.toggleAside() }
          new_email_count={this.state.new_email_count}
          clearNewEmailCount={() => {this.clearNewEmailCount()}}
          pending_messages={this.state.pending_messages}
          />
      </header>
    );
    
    let side_menu = (<aside id="aside-main" className={this.state.aside_classes}>
      <Menu {...this.props} toggleAside={() => this.toggleAside() } pending_messages={this.state.pending_messages}/>
    </aside>);

    let routes = [
      <Route key='home' path="/" exact component={() => <RecentActivity files={this.state.files} wallet_address={this.state.wallet_address} jwk={this.state.jwk} />} />,
      <Route key='files' path="/files" exact component={() => <FoldersView files={this.state.files} wallet_address={this.state.wallet_address} jwk={this.state.jwk} />} />,
      <Route key='search' path="/search" exact component={() => <SearchPage wallet_address={this.state.wallet_address} jwk={this.state.jwk} />} />,
      <Route key='logout' path="/logout" exact component={() => <Logout onLogout={this.disconnectWallet.bind(this)} addSuccessAlert={this.addSuccessAlert} expandContentArea={() => {this.expandContentArea()}} />} />
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

    

    if(this.state.isAuthenticated == false) {
      routes = [
        <Route key='home' path="/" exact component={() => <HomePage wallet_address={this.state.wallet_address} jwk={this.state.jwk} />} />,
        <Route key='downloads' path="/downloads" exact component={() => <Downloads wallet_address={this.state.wallet_address} jwk={this.state.jwk} />} />,
        <Route key='login' path="/login" exact component={() => <Login expandContentArea={() => {this.expandContentArea()}} setWalletAddress={this.setWalletAddress.bind(this)} />} />,
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

    if(this.state.isAuthenticated && this.props.location.pathname === '/login') {
      routes.push(<Redirect to='/' />);
    }

    

    return (<>
      {page_content}
      </>      
    );
  }
  
}

export default withRouter(App);
