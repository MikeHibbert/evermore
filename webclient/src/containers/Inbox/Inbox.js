import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Spinner from '../../components/Spinner/Spinner';
import InboxMessage from './InboxMessage';
import SentMessage from './SentMessage';
import Pagination from "react-js-pagination";


class Inbox extends Component {

  state = {
    current_balance: 0.0,
    measure_enabled: false,
    account: null,
    messages: [],
    latest_messages: [],
    loading: true,
    active_page: 1
  }

  constructor(props) {
    super(props);

    this.handlePageChange.bind(this);
    this.getPaginatedMessages.bind(this);
  }

  componentDidMount() {
    if(this.state.messages.length == 0) {
        this.handlePageChange(this.state.active_page);
    }
  }

  componentDidUpdate(prevProps) {
    if(this.props.messages != undefined && this.props.messages != prevProps.messages) {
        this.handlePageChange(this.state.active_page);
    }  
  }

  componentWillUnmount() {
    // fix Warning: Can't perform a React state update on an unmounted component
    this.setState = (state,callback)=>{
        return;
    };
  }

  handlePageChange(active_page) {
    const start = (active_page - 1) * 10;
    const end = start + 9;

    const messages = this.getPaginatedMessages(start, end);

    this.setState({messages: messages, active_page: active_page})
  }

  getPaginatedMessages(start, end) {
      
    const messages = [];
    for(let i=start; i <= end; i++) {
      if(this.props.messages[i] != undefined) {
        messages.push(this.props.messages[i]);
      }
      
    }

    return messages;
  }

  render() {
    let messages_rows = [<Spinner key={1} />];
    const that = this;

    let title = "Inbox";
    if(that.props.hasOwnProperty('showArchived')) {
      title = "Archived (sent > 7 days ago)";
    }

    let thead = <tr className="text-muted fs--13">
                    <th>
                        <span className="px-2 p-0-xs">
                            SUBJECT
                        </span>
                    </th>
                    <th className="w--200 hidden-lg-down">SENDER</th>
                    <th className="w--200 hidden-lg-down">DATE</th>
                    <th className="w--60">&nbsp;</th>
                </tr>;
    if(that.props.hasOwnProperty('showSent')) {
      title = "Sent";
      thead = <tr className="text-muted fs--13">
                    <th>
                        <span className="px-2 p-0-xs">
                            To
                        </span>
                    </th>
                    <th className="w--200 hidden-lg-down">Trasaction ID</th>
                    <th className="w--200 hidden-lg-down">When</th>
                    <th className="w--60">&nbsp;</th>
                </tr>;
    }

    if(this.state.messages.length > 0) {
      var oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      var afterTimestamp = Math.round(oneWeekAgo.getTime() / 1000);

      

      const messages = this.state.messages.map(msg => {
          if(that.props.hasOwnProperty('showArchived')) {
            if(parseInt(msg["unixTime"]) > afterTimestamp) {
              return null;
            }
          } else {
            if(parseInt(msg["unixTime"]) < afterTimestamp) {
              return null;
            }
          }
          let el = null;
          if(that.props.hasOwnProperty('showSent')) {
            if(!msg.hasOwnProperty('to')) {
              msg['to'] = msg['target'];
              msg['unixTime'] = "PENDING";
            }
            el = <SentMessage message={msg} key={msg.id} />;
          } else {
            el = <InboxMessage message={msg} key={msg.id} />;
          }
          return el;
      });

      messages_rows = <div className="portlet-body pt-0">
                          <div className="table-responsive">

                              <table className="table table-align-middle border-bottom mb-6">

                                  <thead>
                                      {thead}
                                  </thead>

                                  <tbody id="item_list">
                                      {messages}
                                  </tbody>
                              </table>
                              <Pagination
                                  activePage={this.state.active_page}
                                  itemsCountPerPage={10}
                                  totalItemsCount={this.props.messages.length}
                                  pageRangeDisplayed={5}
                                  onChange={(active_page) => {this.handlePageChange(active_page)}}
                                  itemClass='page-item'
                                  linkClass='page-link'
                                  activeClass='active'
                                  activeLinkClass=''
                                  />
                          </div>
                      </div>;
    }

    const now = new Date();
    const a_week_ago = now.setDate(now.getDate() - 7);

    return ( <>
    <div className="row gutters-sm">
        <div className="col-12 col-lg-9 col-xl-12">
            <div className="portlet">
                <div className="portlet-header border-bottom">

                    <div className="float-end">

                        <Link to='/message/new' className="btn btn-sm btn-primary btn-pill px-2 py-1 fs--15 mt--n3">
                            + write
                        </Link>

                    </div>

                    <span className="d-block text-muted text-truncate font-weight-medium pt-1">
                        {title}
                    </span>
                </div>

                {messages_rows}
            </div>
        </div>
    </div>
    </>);
  }

}

export default Inbox;