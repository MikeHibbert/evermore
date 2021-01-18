const ipc = require('node-ipc');

ipc.config.socketRoot = 'G4X28XL4YD';
ipc.config.id = '.socketApi';
ipc.config.appspace = 'com.evermoredata.store';

ipc.serve(function(data) {
    ipc.server.on(
        'message',
        function(data,socket){
            ipc.log('got a message : '.debug, data);
            ipc.server.emit(
                socket,
                'message',  //this can be anything you want so long as
                            //your client knows.
                data+' world!'
            );
        }
    );
});

ipc.server.start();