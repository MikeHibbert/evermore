import React, {Component} from 'react';
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
import {getDownloadableFilesGQL} from './containers/Files/helpers';
import {getName} from './components/Message/helpers';
import arweave from './arweave-config';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import { getPersistenceRecords } from './containers/Files/helpers';
import ReactGA from 'react-ga';

const trackingId = "G-YSH82SBB2L"; // Replace with your Google Analytics tracking ID
ReactGA.initialize(trackingId,{debug: true});
ReactGA.set({
  userId: sessionStorage.getItem('AR_Wallet', null),
  // any data that is relevant to the user session
  // that you would like to track with google analytics
});

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
    this.checkMiningStatus.bind(this);
  } 

  componentDidMount() {
    const wallet_address = sessionStorage.getItem('AR_Wallet', null);
    const jwk = JSON.parse(sessionStorage.getItem('AR_jwk', null));  
    
    if(jwk !== null) {
      this.setState({isAuthenticated: true, wallet_address: wallet_address, jwk: jwk});
      this.loadWallet(wallet_address, jwk);
    }

    const isAuthenticated = sessionStorage.getItem('isAuthenticated');

    this.setState({isAuthenticated: isAuthenticated === 'true' ? true : false});

    const that = this;
    this.interval = setInterval(() => {
      // console.log('checkMiningStatus')
      that.checkMiningStatus();                
    }, 2 * 60 * 1000);

    // if(this.props.isAuthenticated == undefined) {
    //   return;
    // }

    
    
    this.props.history.listen(location => {
      ReactGA.set({ page: location.pathname }); // Update the user's current page
      ReactGA.pageview(location.pathname); // Record a pageview for the given page
    });
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

  async loadWallet(wallet_address, wallet) {
    const that = this;

    if(wallet_address) {
        arweave.wallets.getBalance(wallet_address).then((balance) => {
            let ar = arweave.ar.winstonToAr(balance);

            const state = {balance: ar};

            that.setState(state);
        }); 

        const files = await getDownloadableFilesGQL(wallet_address, wallet);
        
        // if(files.children.length > this.state.files.length && this.state.files.length > 0) {
        //   const new_count = files.length - this.state.files.length;
        //   this.setState({new_files_count: new_count});
        //   this.addSuccessAlert("You have " + new_count + " new files");
        // } 
       
        // const pending_files = getPendingFiles();
        
        that.setState({files: files});    
        
        const persistence_records = await getPersistenceRecords(wallet_address)

        that.setState({persistence_records: persistence_records});

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
          
              that.loadWallet(wallet_address, jwk);

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

  addToTransactionsToBeMined(transaction_record) {
    debugger;
    const transactions_to_be_mined = [...this.state.transactions_to_be_mined];

    const matches = transactions_to_be_mined.filter(tx => tx.id != transaction_record.id);

    if(matches.length == 0) {
      transactions_to_be_mined.push(transaction_record);
    }    

    this.setState({transactions_to_be_mined: transactions_to_be_mined});
  }

  removeFromTransactionsToBeMined(transaction_id) {
    const transactions_to_be_mined = this.state.transactions_to_be_mined.filter(tx => tx.id != transaction_id);
    this.setState({transactions_to_be_mined: transactions_to_be_mined});
  }

  checkMiningStatus() {
    const that = this;

    for(let i in this.state.transactions_to_be_mined) {
        const submitted_file = this.state.transactions_to_be_mined[i];

        try {
            arweave.transactions.getStatus(submitted_file.id).then(response => {
                if(response.hasOwnProperty('confirmed') && response.status === 200) {
                    if(response.confirmed.number_of_confirmations > 4) {
                        that.addSuccessAlert(`${submitted_file.name} has been successfully mined`);
                        that.removeFromTransactionsToBeMined(submitted_file.id);
                    }
                } 
            });
        } catch(e) {
            console.log(e);
        }
    }
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
      <Route key='files' path="/files" exact component={() => <FoldersView 
                                                                  location={this.props.location}
                                                                  files={this.state.files} 
                                                                  wallet_address={this.state.wallet_address} 
                                                                  wallet_balance={this.state.balance}
                                                                  jwk={this.state.jwk} 
                                                                  addToTransactionsToBeMined={(transaction_record) => {this.addToTransactionsToBeMined(transaction_record)}}
                                                                  removeFromTransactionsToBeMined={(tx_id) => {this.removeFromTransactionsToBeMined(tx_id)}}
                                                                  transactions_to_be_mined={this.state.transactions_to_be_mined}
                                                                  addSuccessAlert={this.addSuccessAlert}
                                                                  addErrorAlert={this.addErrorAlert} />} />,
      <Route key='file' path='/file/:id' component={() => <FileDetail 
                                                                  match={this.props.match}
                                                                  location={this.props.location}
                                                                  files={this.state.files} 
                                                                  wallet_address={this.state.wallet_address} 
                                                                  wallet_balance={this.state.balance}
                                                                  jwk={this.state.jwk} 
                                                                  addSuccessAlert={this.addSuccessAlert}
                                                                  addErrorAlert={this.addErrorAlert}
                                                                />} />,
      <Route key='archived' path="/archived" exact component={() => <DeletedView persistence_records={this.state.persistence_records} wallet_address={this.state.wallet_address} jwk={this.state.jwk} />} />,
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
      routes.push(<Redirect to='/files' />);
    }

    

    return (<>
      {page_content}
      </>      
    );
  }
  
}

export default withRouter(App);
