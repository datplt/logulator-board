(function(exports, $) {

  var WebsocketClient = exports.WebsocketClient = function(params) {
    params = params || {};
    this.socket = io.connect(getBaseURL());
  };

  WebsocketClient.prototype.init = function(params) {
    var self = this;
    debuglog(' + WebsocketClient.init() is starting');

    self.socket.on('devebot-error', function(data) {
      debuglog(' - devebot-error: %s', JSON.stringify(data));
    });

    debuglog(' - WebsocketClient.init() has been done.');
  };

  var getBaseURL = function getBaseURL() {
   return location.protocol + "//" + location.hostname +
      (location.port && ":" + location.port);
  };

  var debuglog = function debuglog() {
    console.log.apply(console, arguments);
  };
})(this, jQuery);

var client = new WebsocketClient();

window.addEventListener('load', function() {
  client.init();
});
