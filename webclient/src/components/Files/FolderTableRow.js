import React, {Component} from 'react';
import Moment from 'react-moment';
import { Link } from 'react-router-dom';

class FolderTableRow extends Component  {
    state = {
        optionsDialogCss: "clearfix",
        optionsDialogStyle: {}
    }

    constructor() {
        super();

        this.toggleOptions.bind(this);
    }

    toggleOptions() {
        if(this.state.optionsDialogCss == "clearfix") {
            this.setState({
                optionsDialogCSS: "clearfix show",
                optionsDialogStyle: {
                    position: "absolute",
                    transform: "translate3d(1014px, 174px, 0px)",
                    top: "0px",
                    left: "0px",
                    willChange: "transform"
                }
            });
        } else {
            this.setState({
                optionsDialogCSS: "clearfix",
                optionsDialogStyle: {}
            });
        }
    }

    onSelectFolder(e) {
        e.preventDefault();

        this.props.onSelectFolder(this.props.file_info.name);
    }

    render() {
        return (
            <tr>
                <td>
                    
                    <Link to='/files' onClick={e => { this.onSelectFolder(e) }} >
                        <img src="assets/images/folder_icon.png" style={{fontSize: "32px", width:"32px", marginRight: "10px"}}/>
                        {this.props.file_info.name}
                    </Link>

                </td>


                <td>
                </td>

                <td className="text-align-end">

                   

                </td>

            </tr>
        );
    }
} 

export default FolderTableRow;