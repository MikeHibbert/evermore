import React from 'react';
import { Link } from 'react-router-dom';
import { Visualizer } from 'react-music-visualizer';

function truncate(str, n){
    return (str.length > n) ? str.substr(0, n-1) + '...' : str;
};

export function getContentElementBasedOnType(nft, initialStateTag, height="auto", width="auto", addVideoPoster=false) {
    const contentTypeTag = nft.processed_tags['Content-Type'];
    

    const contentURL = `https://arweave.net/${nft.id}`;


    const styles = {objectFit: 'cover', height:height}
    if(width) {
        styles['width'] = width;
    }


    if(contentTypeTag.indexOf('image') != -1) {
        
        return <img src={contentURL} title={initialStateTag.name} className="img-fluid" style={styles} />
    } else {
        console.log(contentTypeTag)
    }

    if(contentTypeTag.indexOf('audio') != -1) {

        return <div style={{textAlign: "center"}}>
                    <img src="https://arweave.net/c1mNDCo3Mh1PdimUr5OEYyVdbgOowXV2Ct_JN5irnRE" title={initialStateTag.name} className="img-fluid" style={styles} />
                    <audio preload="auto" controls autoplay >
                        <source src={contentURL} type={contentTypeTag} />
                    </audio>
              </div>
        
    }

    if(contentTypeTag.indexOf('video') != -1) {
        let poster = null;
        if(addVideoPoster) {
            poster = "https://arweave.net/c1mNDCo3Mh1PdimUr5OEYyVdbgOowXV2Ct_JN5irnRE";
        }
        return <div className="embed-responsive embed-responsive-16by9" style={styles} >
                <video preload="auto" controls poster={poster}>
                    <source src={contentURL} type="video/mp4" />
                </video>
              </div>;

              
    }

    return <img src={contentURL} title={initialStateTag.name} className="img-fluid" />
}

export default function NFTThumbnail(props) {
    const initialStateTag = props.nft.processed_tags['Init-State'];
    const contentElement = getContentElementBasedOnType(props.nft, initialStateTag);
    const detailLink = <Link to={{pathname: `/nft-detail/${props.nft.id}`, id: props.nft.id, nft: props.nft}} className="btn btn-primary btn-soft mb-3 mt-20" params={{id: props.nft.id}}>More Details</Link>
    return (<>
        <div className="col-12 col-sm-6 col-md-3 col-lg-3 teacher-single" >
            <div className="teacher-body">
                <div className="teacher_pro">
                    <div className="teachar_img" style={{minHeight: "300px", paddingTop: 'auto'}}>
                        <a href="" title="">{contentElement}</a>
                    </div>
                    <ul className="list-unstyled teachers_social">
                        <li>{detailLink}</li>
                    </ul>
                </div>
                <div className="teachars-info" style={{wordBreak: "break-word", textAlign: 'left', minHeight:'179px'}}>
                    <h3 style={{fontSize: '15px', lineHeight: "16px"}}><a href="" title="">{initialStateTag.name}</a></h3>
                    <p >{truncate(initialStateTag.description.replace(' - Created with Evermore', ''), 80)}</p>
                </div>
            </div>
            
        </div>
    </>);
}