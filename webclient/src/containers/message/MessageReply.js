import React from 'react';
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Link,
    useParams
} from "react-router-dom";
import MessageForm from './Compose';

const MessageReply = (props) => {
    let { id } = useParams();

    let message = {
        to: '',
        mail: {
            subject: '',
            body: ''
        }
    }

    if(props.messages.length > 0) {
        message = props.messages.find((message) => {return message.id === id});
        message['to'] = message['from'];
        message.mail.subject = "RE: " + message.mail.subject;
        message.mail.body = "\n\n...\n" + message.mail.body;
    }

    return (<div className="row gutters-sm">
                <div className="col-12 col-lg-9 col-xl-12">
                    <div className="portlet">
                        <div className="portlet-header border-bottom">
                            
                            <span className="d-block text-muted text-truncate font-weight-medium pt-1">
                                Reply to {message.from}
                            </span>
                        </div>
                        <div className="portlet-body pt-0">
                            <MessageForm message={message} history={props.history} getPendingMessages={() => { props.getPendingMessages() }} />
                        </div>
                    </div>
                    
                </div>
            </div>);
}

export default MessageReply;