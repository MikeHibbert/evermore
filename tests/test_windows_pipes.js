const net = require('net');
const os = require('os');

const userName = os.userInfo().username;
let pipeAddress = `\\\\.\\pipe\\EvermoreDatastore-${userName}`;
 
var client = net.connect(pipeAddress, function() {
  console.log('Client: on connection');
})

client.on('data', function(data) {
  console.log('Client: on data:', data.toString());
  client.end('Thanks!');
});

client.on('end', function() {
  console.log('Client: on end');
})

client.write("RETRIEVE_FILE_STATUS:C:\\Users\\hibbe\\Documents\\Evermore\\Test\\Hamster.bmp")