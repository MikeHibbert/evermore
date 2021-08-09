import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import EmailBadge from './EmailBadge';
import {getName} from '../Message/helpers';
import settings from '../../app-config';
import Web3 from 'web3';

class UserMenu extends Component {
  state = {
    opened: false,
    navClasses: ['prefix-link-icon', 'prefix-icon-dot', 'dropdown-menu', 'dropdown-menu-clean',
     'dropdown-menu-navbar-autopos', 'dropdown-menu-invert', 'dropdown-click-ignore', 'p-0', 'mt--18', 'fs--15', 'w--300'],
    wallet_address: null,
    current_balance: 0,
    evermore_balance: 0
  }

  async componentDidMount() {

    // console.log(this.props);
    this.unlisten = this.props.history.listen((location, action) => {
      if(this.state.opened === true) {
        this.setState({navClasses: ['prefix-link-icon', 'prefix-icon-dot', 'dropdown-menu', 'dropdown-menu-clean',
        'dropdown-menu-navbar-autopos', 'dropdown-menu-invert', 'dropdown-click-ignore', 'p-0', 'mt--18', 'fs--15', 'w--300', 'show'], opened: false});
      }
    });
  }

  componentDidUpdate(prevProps) {
    if(this.props.currrent_balance !== undefined && this.props.current_balance !== prevProps.current_balance) {
      this.setState({current_balance: this.props.current_balance});
    }
  }

  componentWillUnmount() {
      this.unlisten();
  }

  handleMenuToggle() {
    this.setState({opened: !this.state.opened});

    if(this.state.opened !== true) {
      this.setState({navClasses: ['prefix-link-icon', 'prefix-icon-dot', 'dropdown-menu', 'dropdown-menu-clean',
      'dropdown-menu-navbar-autopos', 'dropdown-menu-invert', 'dropdown-click-ignore', 'p-0', 'mt--18', 'fs--15', 'w--300', 'show']});
    } else {
      this.setState({navClasses: ['prefix-link-icon', 'prefix-icon-dot', 'dropdown-menu', 'dropdown-menu-clean',
      'dropdown-menu-navbar-autopos', 'dropdown-menu-invert', 'dropdown-click-ignore', 'p-0', 'mt--18', 'fs--15', 'w--300']});
    }
  }

  render() {
    return (<>
      <nav>
          
          <ul className="list-inline list-unstyled mb-0 d-flex align-items-end">
            <EmailBadge new_email_count={this.props.new_email_count} clearNewEmailCount={() => {this.props.clearNewEmailCount()}} />
            <li className="list-inline-item ml--6 mr--6 dropdown">

              <a onClick={this.handleMenuToggle.bind(this)} className="btn btn-sm btn-light dropdown-toggle btn-pill pl--12 pr--12" data-toggle="dropdown" aria-expanded="false" aria-haspopup="true">
                
                <span className="group-icon m-0">
                  <i className="fi w--15 fi-user-male"></i>
                  <i className="fi w--15 fi-close"></i>
                </span>

                <span className="fs--14 d-none d-sm-inline-block font-weight-medium">{this.props.wallet_address}</span>
              </a>

              <div  className={this.state.navClasses.join(' ')} >
                <a className="prefix-icon-ignore dropdown-footer dropdown-custom-ignore font-weight-medium pt-3 pb-3">Balance: <small className="d-block text-muted">{this.props.current_balance} ETH</small></a>
                {/* <a className="prefix-icon-ignore dropdown-footer dropdown-custom-ignore font-weight-medium pt-3 pb-3">Evermore Tokens: <small className="d-block text-muted">{this.state.evermore_balance} EDST</small></a> */}
                <div className="dropdown-divider mb-0"></div>
                <Link to='/logout' className="prefix-icon-ignore dropdown-footer dropdown-custom-ignore font-weight-medium pt-3 pb-3"><i className="fi fi-power float-start"></i> Log Out</Link>
    
              </div>

            </li>

          </ul>
      </nav>
      
   </> );
  }
}

export default UserMenu;
