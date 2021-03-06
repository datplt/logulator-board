'use strict';

var SERVER_PORT = 17777;

var path = require('path');
var express = require('express');

var debug = require('debug');
var debuglog = debug('logulator:master:main');

var app = express();

app.use('/bootstrap-slider', express.static(__dirname + '/node_modules/bootstrap-slider/dist'));
app.use('/d3/d3.v3.min.js', express.static(__dirname + '/node_modules/d3/d3.min.js'));
app.use('/guid/guid.js', express.static(__dirname + '/node_modules/guid/guid.js'));
app.use('/', express.static(path.join(__dirname, './public')));

var server = app.listen(SERVER_PORT, '0.0.0.0', function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Logulator master listening at http://%s:%s', host, port);
});

var ioserver = require('./lib/socketio-server.js');
ioserver.listen(server);
