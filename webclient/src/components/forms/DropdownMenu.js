import { render } from '@testing-library/react';
import React, {Component} from 'react';

export default class DropdownMenu extends Component {
    state = {
        selected: {
            name: "Select item",
            value: null
        }
    }

    constructor() {
        super();

        this.onClickSelection.bind(this);
    }

    onClickSelection(value, name) {
        this.setState({selected: {name: name, value: value}});
        if(this.props.onClickSelection) {
            this.props.onClickSelection({name: name, value: value});
        }
    }

    onToggleDropdown(e) {
        
    }

    render() {
        const that = this;

        let value_feild = 'value';
        let name_feild = 'name';

        if(this.props.value_feild) value_feild = this.props.value_feild;
        if(this.props.name_feild) name_feild = this.props.name_feild;

        const options = this.props.items.map(item => {
            return <option value={item[value_feild]}>{item[name_feild]}</option>
        })

        const selection_list_items = this.props.items.map(item => {
            return <li className="selected active">
                        <a 
                            role="option" 
                            className="dropdown-item active selected" 
                            onClick={(e) => { this.onClickSelection(item[value_feild], item[name_feild]) }}
                        >
                            <span className="text">{item[name_feild]}</span>
                        </a>
                    </li>
        })

        return <>
        <div className="dropdown">
            <div className="dropdown bootstrap-select form-control bs-select">
                <select id="select_options" className="form-control bs-select js-bselectified" data-style="select-form-control border" tabindex="null">
                    {options}
                </select>
                <button type="button" tabindex="-1" className="btn dropdown-toggle select-form-control border" data-toggle="dropdown" role="combobox" aria-owns="bs-select-1" aria-haspopup="listbox" aria-expanded="false" data-id="select_options" title="Option 1">
                    <div className="filter-option">
                        <div className="filter-option-inner">
                            <div className="filter-option-inner-inner">{this.state.selected.name}</div>
                        </div> 
                    </div>
                </button>
                <div className="dropdown-menu" style={{maxHeight: "178.75px", overflow: "hidden", minHeight: "0px;"}}>
                    <div className="inner show" role="listbox" id="bs-select-1" tabindex="-1" aria-activedescendant="bs-select-1-0" style={{maxHeight: "170.75px", overflowY: "auto", minHeight: "0px;"}}>
                        <ul className="dropdown-menu inner show" role="presentation" style={{marginTop: "0px", marginBottom: "0px;"}}>
                            {selection_list_items}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        </>
    }
}