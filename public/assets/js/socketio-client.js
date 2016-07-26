var AGENT_VERSION = '^0.1.4';

(function(exports, $, _) {

  var ClientWebsocket = exports.ClientWebsocket = function(params) {
    var self = this;
    params = params || {};
    params.config = params.config || {};

    debuglog(' + ClientWebsocket constructor is starting');

    self.id = params.id;
    self.config = params.config;

    self.widget = buildAgentWidget(self.id, self.config);

    self.socket = io.connect(self.config.url || getBaseURL());

    self.socket.on('exception', function(data) {
      debuglog(' - Agent[%s]@[%s] is error: %s', self.id, self.config.url, JSON.stringify(data));
    });

    self.socket.on('action-done', function(data) {
      debuglog(' - Agent[%s]@[%s] has finished: %s', self.id, self.config.url, JSON.stringify(data));
    });

    self.socket.on('start-worker-done', function(result) {
      turnonWorker(self.id, result.workerId, true);
    })

    self.socket.on('stop-worker-done', function(result) {
      turnonWorker(self.id, result.workerId, false);
    })

    self.socket.on('init-workers-done', function(workers) {
      workers = workers || [];

      var workerContainer = getWorkerContainer(self.id);

      var workerMap = _.keyBy(workers, 'workerId');
      _.forEach(self.config.workers, function(worker) {
        var workerState = workerMap[worker.id];
        if (workerState && workerState.code == 200) {
          worker.status = 1;
        } else {
          worker.status = -1;
        }

        var workerWidget = createWorkerWidget(worker);

        workerWidget.find('button#start').click(function() {
          self.socket.emit('start-worker', { id: worker.id});
        });

        workerWidget.find('button#stop').click(function() {
          self.socket.emit('stop-worker', { id: worker.id});
        });

        var delaytimeSegmentSlider = workerWidget.find("#delaytimeSegmentSlider").slider({
          id: "delaytimeSegmentSlider",
          value: worker.delaytime.segment,
          min: worker.delaytimeRange.segmentMin,
          max: worker.delaytimeRange.segmentMax,
          step: worker.delaytimeRange.segmentStep
        }).on("slideStop", function(slideEvt) {
        	self.socket.emit('update-delaytime', { id: worker.id, delaytime: {segment: slideEvt.value} });
          workerWidget.find('#delaytimeSegmentVal').html(slideEvt.value);
        });

        var delaytimeOffsetSlider = workerWidget.find("#delaytimeOffsetSlider").slider({
          id: "delaytimeOffsetSlider",
          value: worker.delaytime.offset,
          min: worker.delaytimeRange.offsetMin,
          max: worker.delaytimeRange.offsetMax,
          step: worker.delaytimeRange.offsetStep
        }).on("slideStop", function(slideEvt) {
          self.socket.emit('update-delaytime', { id: worker.id, delaytime: {offset: slideEvt.value} });
          workerWidget.find('#delaytimeOffsetVal').html(slideEvt.value);
        });

        workerWidget.find('#delaytimeSegmentVal').html(delaytimeSegmentSlider.slider('getValue'));
        workerWidget.find('#delaytimeOffsetVal').html(delaytimeOffsetSlider.slider('getValue'));

        workerContainer.append(workerWidget);

        turnonWorker(self.id, worker.id, false);
      });

      debuglog(' - create view for workers');
    });

    self.socket.on('connect-agent-done', function(result) {
      if (_.isEmpty(result.status)) {
        debuglog(' + agent information: %s', JSON.stringify(result));

      } else if (result.status == 'pass') {
        debuglog(' + agent version is valid: %s', JSON.stringify(result));
        self.socket.emit('init-workers', self.config.workers);
      } else if (result.status == 'fail') {
        debuglog(' + agent version is invalid: %s', JSON.stringify(result));
      }
    });

    self.socket.emit('connect-agent', {
      agent: {
        version: AGENT_VERSION
      }
    });

    debuglog(' - ClientWebsocket constructor has been done.');
  };

  var getBaseURL = function getBaseURL() {
   return location.protocol + "//" + location.hostname + (location.port && ":" + location.port);
  };

  var debuglog = function debuglog() {
    console.log.apply(console, arguments);
  };

  var buildAgentWidget = function(id, config) {
    var agentWidget = $('<div/>').attr('agent-id', id).appendTo('#widget-panel');
    agentWidget.append(
      $('<div class="panel panel-info">' +
          '<div class="panel-heading">' +
            '<h3 class="panel-title">Panel title</h3>' +
          '</div>' +
          '<div class="panel-body" id="workers">' +
          '</div>' +
        '</div>'));
    agentWidget.find('.panel-title').html(id);
    return agentWidget;
  };

  var getWorkerContainer = function(agentId) {
    return $('#widget-panel div[agent-id="' + agentId + '"] #workers');
  }

  var getWorker = function(agentId, workerId) {
    return $('#widget-panel div[agent-id="' + agentId + '"] #workers div[worker-id="' + workerId + '"]');
  }

  var turnonWorker = function(agentId, workerId, enabled) {
    var worker = getWorker(agentId, workerId);
    if (enabled) {
      worker.find('button#start').addClass('disabled');
      worker.find('button#stop').removeClass('disabled');
    } else {
      worker.find('button#start').removeClass('disabled');
      worker.find('button#stop').addClass('disabled');
    }
  }

  var createWorkerWidget = function(workerConfig) {
    return $('<div class="panel panel-success">' +
        '<div class="panel-heading">' +
          '<h3 class="panel-title">' + workerConfig.id + '</h3>' +
        '</div>' +
        '<div class="panel-body" id="buttons">' +
          '<button id="start" class="btn btn-primary">Start</button>' +
          '<button id="stop" class="btn btn-primary">Stop</button>' +
          '<span>&nbsp;&nbsp;&nbsp;</span>' +
          '<input id="delaytimeSegmentSlider" type="text" data-slider-min="5" data-slider-max="5000" data-slider-step="10" data-slider-value="500"/>' +
          '<span>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;</span>' +
          '<input id="delaytimeOffsetSlider" type="text" data-slider-min="0" data-slider-max="100" data-slider-step="1" data-slider-value="10"/>' +
          '<span>&nbsp;&nbsp;&nbsp;</span>' +
          '<span id="delaytimeInfoLabel">Segment: <span id="delaytimeSegmentVal">-1</span> / Offset: <span id="delaytimeOffsetVal">-1</span></span>' +
        '</div>' +
      '</div>').attr('worker-id', workerConfig.id);
  }

  var ClientManager = exports.ClientManager = function(params) {
    var self = this;
    params = params || {};

    self.agentContexts = {};

    var agentConfigs = params.agents || params.agentConfigs || [];
    agentConfigs.forEach(function(agentConfig) {
      var agentId = agentConfig.url;

      var agentSocket = new ClientWebsocket({
        id: agentId,
        config: agentConfig
      });

      self.agentContexts[agentId] = {
        config: agentConfig,
        socket: agentSocket
      }
    });
  };
})(this, jQuery, _);

var clientManager = null;
window.addEventListener('load', function() {
  $.getJSON("config/local.json", {}).done(function( agents ) {
    clientManager = new ClientManager({
      agents: agents
    });
  }).fail(function(error) {
    console.log( "error: " + JSON.stringify(error));
  });
});
