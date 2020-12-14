import React, { Component } from 'react';
import MenuItem from './MenuItem';
import { Link } from 'react-router-dom';


class Menu extends Component {
  render() {
    let pending = null;

    if(this.props.pending_messages.length > 0) {
      pending = <MenuItem icon='arrow-end' name='Pending uploads' url='/pending' {...this.props}/>
    }

    return (
      <>
      <div className="d-none d-sm-block">
          <div className="clearfix d-flex justify-content-between">
            <Link to='/' className="w-100 align-self-center navbar-brand p-3" >
              <img src="images/evermore-logo-light.png" width="110" alt="..." />
            </Link>

          </div>
        </div>
      <div className="aside-wrapper scrollable-vertical scrollable-styled-light align-self-baseline h-100 w-100">
        <nav className="nav-deep nav-deep-dark nav-deep-hover fs--15 pb-5 js-ajaxified">
        <ul id="nav_responsive" className="nav flex-column">
              <MenuItem icon='home' name='Recent Activity' url='/' {...this.props}/>
              <MenuItem icon='arrow-end' name='Files' url='/files' {...this.props}/>
              <MenuItem icon='arrow-end' name='Archived Files' url='/archived' {...this.props}/>
              {pending}
        </ul>
        </nav>
      </div>
    </>
    );
  }
}

export default Menu;
