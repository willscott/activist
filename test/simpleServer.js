var net = require('net');
var host = '0.0.0.0';

var ports = [20000];

// Create servers
ports.forEach(function (port) {

var s = net.createServer(function (sock) {
    // We have a connection - a socket object is assigned to the connection automatically
    console.log('CONNECTED (' + sock.localPort + '): ' + sock.remoteAddress + ':' + sock.remotePort);

    // Add a 'data' event handler to this instance of socket
    sock.on('data', function (data) {
        // post data to a server so it can be saved and stuff
        console.log(data);
        //postData(data.toString(), sock);
        sock.write("hello");
        // close connection
        sock.end();
    });

    sock.on('error', function (error) {
        console.log('******* ERROR ' + error + ' *******');

        // close connection
        sock.end();
    });
});

s.listen(port, host, function () {
    console.log('Server listening on ' + host + ':' + s.address().port);
});


});