import React, { Component } from 'react';

class Message extends Component {
    render() {
        return <div><p>{this.props.message}</p></div>
    }
}

export default Message;
