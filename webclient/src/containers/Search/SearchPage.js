import React, { Component } from 'react';
import getMessages from '../../components/Message/helpers';
import Message from '../../components/Message/Message';
import arweave from '../../arweave-config';
import settings from '../../app-config';



class SearchPage extends Component {
    state = {
        messages: []
    }

    onChange(event)  {
        const search = event.target.value;

        this.searchMessages(search);
    }

    async searchMessages(search)  {
        if(search.length > 0) {
            const wallet_address = sessionStorage.getItem('AR_Wallet');
            const txids = await arweave.arql({
                op: "and",
                expr1: {
                    op: "equals",
                    expr1: "app",
                    expr2: settings.APP_TAG
                },
                expr2: {
                    op: "equals",
                    expr1: "data-type",
                    expr2: 'tv-chart-data'
                }
            });
            
            let messages = await getMessages(txids);

            messages = messages.filter((message) => { return message.name.toLowerCase().indexOf(search) != -1 || message.symbol.toLowerCase().indexOf(search) != -1 });

            this.setState({messages: messages});
        } else {
            this.setState({messages: []});
        }
        
    }

    render() {
        let messages = null;

        if(this.state.messages) {
            messages = this.state.messages.map((message) => {
                return <Message key={message.created} columns={3} {...message} />;
            })
        }

        return(<div>
            <header id="page-header">
                <h1>Search</h1>
            </header>
            <div className="col-md-12 padding-20">
                <section className="panel panel-default">
                    <header className="panel-heading">
                        <span className="panel-title pull-left margin-right-20 elipsis">
                            <i className="fa fa-search"></i> Search
                        </span>
                        <label className="pull-left">
                            <input type="text" onChange={(e) => this.onChange(e)} />
                        </label>
                        <div className="clearfix"></div>
                    </header>
                    <div className="panel-body noradius padding-10" style={{minHeight: "700px"}}>
                        <div className="row profile-activity">
                            {messages}
                        </div>
                    </div>
                </section>
            </div>        
        </div>);
    }
}

export default SearchPage;