const NamedPipes = require('named-pipes');
 
const receiver = NamedPipes.connect('EvermoreDatastore');
 
receiver.on('message', (str) =>
  console.log(str));

const sender = NamedPipes.connect('EvermoreDatastore');
sender.send("data", "herrow!");