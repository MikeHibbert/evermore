import React from 'react';
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Link,
    useParams
} from "react-router-dom";
import Moment from 'react-moment';
import Spinner from '../../components/Spinner/Spinner';


const Message = (props) => {
    let { id } = useParams();

    let message_detail = <Spinner />;

    const reply_link_url = "/message/reply/" + id;
    

    if(props.messages.length > 0) {
        const message = props.messages.find((message) => {return message.id === id});
        const mail = message.mail;
        const sent = new Date(parseInt(message.unixTime) * 1000);
        message_detail = <><div className="col-12 col-lg-9 col-xl-10">
                            <div className="portlet">
                            
                                <div className="portlet-header border-bottom">

                                    <div className="container">
                                        <span className="d-block text-truncate font-weight-medium">
                                            From: {message.from}
                                            <small className="d-block">
                                                <Moment fromNow >{sent}</Moment>
                                            </small>
                                            <small className="d-block" style={{marginTop: '20px'}}>
                                                Transaction ID: {message.id}
                                            </small>
                                            
                                        </span>
                                    </div>

                                </div>
                                <div className="portlet-body">

                                    <div className="article-format container" style={{wordWrap: "break-word", whiteSpace: "pre-wrap"}}>

                                        <h5 className="mt-3 mb-4">
                                            {mail.subject}
                                        </h5>

                                        {mail.body}

                                    </div>

                                    <div className="clearfix container py-3 bg-light row-pill rounded mt-5">

                                        <Link to={reply_link_url} className="btn btn-sm btn-primary btn-pill">
                                            <i className="fi fi-arrow-right-3"></i>
                                            Reply
                                        </Link>
                                    </div>

                                </div>
                            </div>
                        </div>
                        <div className="col-12 col-lg-3 col-xl-2" style={{marginTop: '10px'}}>
                            <small className="d-block">
                                Fee: <br/>{message.td_fee}
                            </small>
                            <small className="d-block" style={{marginTop: '10px'}}>
                                Amount Sent: <br/>{message.td_qty}
                            </small>
                                
                        </div>
                        </>;
    }

    return (
    <div className="row gutters-sm">
        {message_detail}
    </div>
    );
}

export default Message;