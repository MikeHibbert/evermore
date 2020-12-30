const net = require('net');
const os = require('os');

const userName = os.userInfo().username;
const AppName = 'ownCloud';
let pipeAddress  = `\\\\.\\pipe\\${AppName}-${userName}`;
 
if(process.platform == 'darwin') {
  pipeAddress = 'G4X28XL4YD.com.evermore.desktopclient.socketApi';
}
var client = net.connect(pipeAddress, function(stream) {
  console.log('Client: on connection');
  client.write("RETRIEVE_FILE_STATUS:C:\\Users\\hibbe\\Documents\\Evermore\\Test\\Hamster.bmp");
})

client.on('data', function(data) {
  console.log('Client: on data:', data.toString());
  // client.end('Thanks!');
});

client.on('end', function() {
  console.log('Client: on end');
})

// client.write("RETRIEVE_FILE_STATUS:C:\\Users\\hibbe\\Documents\\Evermore\\Test\\Hamster.bmp")