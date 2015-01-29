var util = require('util');
var pcap = require('pcap');
var filter = 'tcp port 8000';
var session = pcap.createSession('en0', filter);

session.on('packet', function(packet){
    packet = pcap.decode.packet(packet);
    console.log(pcap.print.packet(packet));
});