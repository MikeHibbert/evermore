import React, {useEffect, useState} from 'react';
import DropdownMenu from '../../components/forms/DropdownMenu';


export default function NFTCombineControl(props) {
    const [selected_image_url, setSelectedImageUrl] = useState(null);

    function onClickSelection(nft) {
        if(props.onClickSelection) {
            props.onClickSelection(nft);
        }

        setSelectedImageUrl(`https://arweave.net/${nft.value}`);
    }

    const dropdown = <DropdownMenu items={props.items} onClickSelection={(nft) => onClickSelection(nft)} first_selection={{name: props.selection.name, value: props.selection.name}} />;
    return <div className="mb-3">
            <div>
                <div className="mb-3 col-6">{dropdown}</div>
            </div>
            <div>
                <div className="mb-3 col-6"><img className="img-fluid" src={selected_image_url} /></div>
                <div className="mb-3 col-3">
                
            </div>
            </div>
            
    </div>;
}