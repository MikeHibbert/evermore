export default function WebWorker(args) {
    let onmessage = e => { // eslint-disable-line no-unused-vars
         // THIS IS THE PLACE YOU EMBED YOUR CODE THAT WILL RUN IN BACKGROUND        
         postMessage("Response");
    };
}