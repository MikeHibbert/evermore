import React, { Component }from 'react';
import { Link } from 'react-router-dom';

class Menuitem extends Component {

  closeMenu() {
    this.props.toggleAside();
  }
  
  render() {
    const cssClasses = "fi fi-" + this.props.icon;

    let active = "nav-item";
    // console.log(this.props);
    if(this.props.location.pathname === this.props.url) {
      active = 'nav-item active';
    }

    return (<>
      <li className={active}>
        <Link className="nav-link js-ajax" to={this.props.url} onClick={this.closeMenu.bind(this)} >
          <i className={cssClasses}></i>
          <b>{this.props.name}</b>
        </Link>
      </li>
      </>
    );
  }


}

export default Menuitem;
