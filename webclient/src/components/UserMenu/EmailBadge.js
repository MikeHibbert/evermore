import React from 'react';
import { Link } from 'react-router-dom';

const EmailBadge = function(props) {
    let badge = <span className="badge badge-danger shadow-danger-md animate-pulse fs--10 p--3 mt--n3 position-absolute end-0">{props.new_email_count}</span>;

    if(props.new_email_count == 0 || props.new_email_count == undefined) {
        badge = null;
    }

    return (
        <li className="list-inline-item ml--6 mr--6 dropdown">

            <Link to='/' onClick={() => {props.clearNewEmailCount()}} className="btn btn-sm rounded-circle btn-light dropdown-toggle" >
                
                {badge}

                <span className="group-icon">
                    <i className="fi fi-bell-full"></i>
                    <i className="fi fi-close"></i>
                </span>
            </Link>
        </li>
    )
}

export default EmailBadge;