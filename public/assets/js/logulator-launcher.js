'use strict';

jQuery(document).ready(function( $ ) {
  var clientManager = null;
  window.addEventListener('load', function() {
    $.getJSON("config/agents.json", {}).done(function( agents ) {
      clientManager = new ClientManager({
        agents: agents
      });
    }).fail(function(error) {
      console.log( "error: " + JSON.stringify(error));
    });
  });
});
