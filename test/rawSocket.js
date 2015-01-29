
var raws = require('raw-socket');

var socket;

function setupRawSocket() {
  socket = raws.createSocket({
    protocol:raws.Protocol.TCP
  });

  socket.on ("message", function (buffer, source) {


    console.log(buffer.toString('hex'));
    console.log ("received " + buffer.length + " bytes from " + source);

  });

  socket.on ("error", function (error) {
    console.log (error.toString ());
    socket.close ();
});

  console.log("socket setup");

}

setupRawSocket();