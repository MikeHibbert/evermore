import React, { Component } from 'react';
import DownloadLink from "react-download-link";

function DownloadFile(props) {
    function magicDownload(data, fileName) {
        var blob = new Blob([data], {
          type: "text/csv;charset=utf8;"
        });

        // create hidden link
        var element = document.createElement("a");
        document.body.appendChild(element);
        element.setAttribute("href", window.URL.createObjectURL(blob));
        element.setAttribute("download", fileName);
        element.style.display = "";

        element.click();

        document.body.removeChild(element);
      }

    const downloadFile = () => new Promise((resolve, reject) => {
        props.setDownloading(true);

        setTimeout(() => {
            fetch(props.url, {redirect: 'follow'})
                .then(response => response.text())
                .then(data => {
                    props.setDownloading(false);
                    magicDownload(data, props.filename)
                    resolve(data);
                });
        });
    }, 20);
    
    return (
        <>
            <div>
            <a className="btn btn-lg" onClick={() => downloadFile()}>Download</a>
            </div>
        </>
    )
}

export default DownloadFile;