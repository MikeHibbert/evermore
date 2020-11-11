import React, {Component} from 'react';
import Moment from 'react-moment';
import { Link } from 'react-router-dom';
import { createPersistenceRecord } from '../../containers/Files/helpers';
import arweave from '../../arweave-config';
import { toast } from 'react-toastify';

class DeletedFileTableRow extends Component  {
    state = {
        optionsDialogCss: "dropdown-menu dropdown-menu-clean dropdown-click-ignore max-w-220",
        optionsDialogStyles: null,
        optionParentCss: "clearfix"
    }

    constructor(props) {
        super(props);

        this.toggleOptions.bind(this);
    }

    toggleOptions() {
        if(!this.state.optionsDialogStyles) {
            this.setState({
                optionsDialogCss: "dropdown-menu dropdown-menu-clean dropdown-click-ignore max-w-220 show",
                optionsDialogStyles: {
                    position: "absolute",
                    transform: "translate3d(1014px, 174px, 0px)",
                    top: "0px",
                    left: "0px",
                    willChange: "transform"
                },
                optionParentCss: "clearfix"
            });
        } else {
            this.setState({
                optionsDialogCss: "dropdown-menu dropdown-menu-clean dropdown-click-ignore max-w-220",
                optionsDialogStyles: null,
                optionParentCss: "clearfix"
            });
        }
    }

    downloadTransaction() {
        const that = this;

        this.toggleOptions(); // close the options dialog

        const transaction_url = `https://www.arweave.net/${this.props.file_info.id}`; 

        fetch(transaction_url)
			.then(response => { 
                response.blob().then(blob => {
					let url = window.URL.createObjectURL(blob);
					let a = document.createElement('a');
                    a.href = url;
					a.download = that.props.file_info.name;
					a.click();
				});
            });
    }

    async archiveTransaction() {
        await createPersistenceRecord(this.props.file_info, false, this.props.wallet_jwk);

        toast(`${this.props.file_info.file} is now being unarchived and will be available to download soon.`, { type: toast.TYPE.SUCCESS }); 
    }

    render() {

        const parts = this.props.file_info.path.split("\\");
        const filename = parts[parts.length - 1];

        const last_modified = <Moment format={"DD/MM/YYYY HH:mm"}>{this.props.file_info.modified}</Moment>;

        

        return (
            <tr>
                <td>
                        {filename}
                    <span className="d-block text-muted fs--13">FROM: {this.props.file_info.hostname}</span>
                    <span className="d-block text-muted fs--13">VERSION: {this.props.file_info.version}</span>

                </td>


                <td>

                    <span className="d-block text-danger fs--15">
                        <sup className="text-muted fs--10">{last_modified}</sup>
                    </span>
                </td>

                <td className="text-align-end">

                    <div className={this.state.optionParentCss}>

                        <a onClick={() => {this.toggleOptions()}} className="btn btn-sm btn-light rounded-circle js-stoppropag" data-toggle="dropdown" aria-expanded="false" aria-haspopup="true">
                            <span className="group-icon">
                                <i className="fi fi-dots-vertical-full"></i>
                                <i className="fi fi-close"></i>
                            </span>
                        </a>

                        <div className={this.state.optionsDialogCss} style={this.state.optionsDialogStyles}>
                            <div className="scrollable-vertical max-h-50vh">

                                <a className="dropdown-item text-truncate" onClick={() => { this.archiveTransaction() }}>
                                    <i className="fa fa-download"></i>
                                    UnArchive
                                </a>
                            </div>

                        </div>

                    </div>

                </td>

            </tr>
        );
    }
} 

export default DeletedFileTableRow;