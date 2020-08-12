let backendHost;

const hostname = window && window.location && window.location.hostname;

if(hostname === 'at.hibbertitsolutions.co.uk') {
  backendHost = 'api.hibbertitsolutions.co.uk/api';
} else if(hostname === 'localhost') {
  backendHost = 'http://127.0.0.1:8000/api';
  } else if(/^qa/.test(hostname)) {
  backendHost = `https://api.${hostname}`;
} else {
  backendHost = 'https://api.hibbertitsolutions.co.uk/api';
}

export default backendHost;