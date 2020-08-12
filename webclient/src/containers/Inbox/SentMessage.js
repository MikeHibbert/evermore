import React from 'react';
import Moment from 'react-moment';
import { Link } from 'react-router-dom';

function SentMessage(props) {
    let sent_moment = "PENDING";

    if(props.message.unixTime != "PENDING") {
        const sent = new Date(parseInt(props.message.unixTime) * 1000);
        var oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        sent_moment = <Moment format={"DD/MM/YYYY HH:mm"}>{sent}</Moment>;

        if(sent > oneWeekAgo) {
            sent_moment = <Moment fromNow >{sent}</Moment>;
        }
    }
    

    const link_url = "https://viewblock.io/arweave/tx/" + props.message.id;

    return (
        <tr id="message_id_2" className="text-muted">
            <td>

                <a id={props.message.id} href={link_url} target="_blank" className="font-weight-medium text-muted mx-2 m-0-xs">
                    {props.message.to}
                </a>
            </td>

            <td className="hidden-lg-down text-truncate">
                <a id={props.message.id} href={link_url} target="_blank"  className="font-weight-medium text-muted mx-2 m-0-xs">
                    {props.message.id}
                </a>
            </td>

            <td className="hidden-lg-down">
                <a id={props.message.id} href={link_url} target="_blank"  className="font-weight-medium text-muted mx-2 m-0-xs">
                    {sent_moment}
                </a>
            </td>

        </tr>
    );
}

export default SentMessage;