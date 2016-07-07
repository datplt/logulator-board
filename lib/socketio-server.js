'use strict';

var io = require('socket.io')();

var debug = require('debug');
var debuglog = debug('logulator:master:socketio_server');

io.on('connection', function (socket) {
    debuglog(' + Client make a connection: %s', socket.id);
});

module.exports = io;
