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
      var worker = getWorker(self.id, result.workerId);
      worker.find('button#start').addClass('disabled');
      worker.find('button#stop').removeClass('disabled');
    })

    self.socket.on('stop-worker-done', function(result) {
      var worker = getWorker(self.id, result.workerId);
      worker.find('button#start').removeClass('disabled');
      worker.find('button#stop').addClass('disabled');
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

        workerContainer.append(workerWidget);
      });
      
      debuglog(' - create view for workers');
    })

    self.socket.emit('init-workers', self.config.workers);

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

  var createWorkerWidget = function(workerConfig) {
    return $('<div class="panel panel-success">' +
        '<div class="panel-heading">' +
          '<h3 class="panel-title">' + workerConfig.id + '</h3>' +
        '</div>' + 
        '<div class="panel-body" id="buttons">' +
          '<button id="start" class="btn btn-primary">Start</button>' +
          '<button id="stop" class="btn btn-primary">Stop</button>' +
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

var localagents = [
    {
        url: "http://localhost:17779",
        workers: [
            {
                id: "demo1",
                frequency: 0.05,
                model: [
                    {
                        name: "var1",
                        type: "boolean"
                    }, {
                        name: "var2",
                        type: "integer",
                        min: 5,
                        max: 1000,
                    }, {
                        name: "var3",
                        type: "float",
                        min: 0.0,
                        max: 500
                    }, {
                        name: "var4",
                        type: "string",
                        min: 10,
                        max: 60
                    }, {
                        name: "var6",
                        type: "choice",
                        list: [
                            "String 1",
                            "String 2",
                            "String 3",
                            "String 4"
                        ]
                    }, {
                        name: "var5",
                        type: "datetime"
                    }
                ],
                template: {
                    engine: "string-format",
                    message: "Message include {var6}, '{var1}', {var2} and {var3}"
                },
                logtarget: {
                    file: "/tmp/demo1.log",
                },
                status: 0
            },{
                id: "demo2",
                frequency: 0.05,
                model: [
                    {
                        name: "phone",
                        type: "choice",
                        list: [
                            "+84912345678",
                            "+84921345679",
                            "+84912345676",
                            "+84912345645"
                        ]
                    }, {
                        name: "verifyCode",
                        type: "choice",
                        list: [ "2385", "3487", "0923", "1288"]
                    }, {
                        name: "password",
                        type: "choice",
                        list: ["s3cr3t", "myg0d", "web4pp"]
                    }
                ],
                template: {
                    engine: "json",
                    message: "Message JSON OBJECT: {jsonobject} done!"
                },
                logtarget: {
                    file: "/tmp/demo2.log",
                },
                status: 0
            },{
                id: "demo3",
                frequency: 0.5,
                template: {
                    engine: "fix",
                    message: "You can win if you want"
                },
                logtarget: {
                    file: "/tmp/demo3.log",
                },
                status: 0
            }
        ]
    }
]

var agents = [
    {
        url: "http://192.168.56.71:17779",
        workers: [
            {
                id: "demo1",
                frequency: 0.05,
                model: [
                    {
                        name: "var1",
                        type: "boolean"
                    }, {
                        name: "var2",
                        type: "integer",
                        min: 5,
                        max: 1000,
                    }, {
                        name: "var3",
                        type: "float",
                        min: 0.0,
                        max: 500
                    }, {
                        name: "var4",
                        type: "string",
                        min: 10,
                        max: 60
                    }, {
                        name: "var6",
                        type: "choice",
                        list: [
                            "String 1",
                            "String 2",
                            "String 3",
                            "String 4"
                        ]
                    }, {
                        name: "var5",
                        type: "datetime"
                    }
                ],
                template: {
                    engine: "string-format",
                    message: "Message include {var6}, '{var1}', {var2} and {var3}"
                },
                logtarget: {
                    file: "/tmp/demo1.log",
                },
                status: 0
            },{
                id: "demo2",
                frequency: 0.05,
                model: [
                    {
                        name: "phone",
                        type: "choice",
                        list: [
                            "+84912345678",
                            "+84921345679",
                            "+84912345676",
                            "+84912345645"
                        ]
                    }, {
                        name: "verifyCode",
                        type: "choice",
                        list: [ "2385", "3487", "0923", "1288"]
                    }, {
                        name: "password",
                        type: "choice",
                        list: ["s3cr3t", "myg0d", "web4pp"]
                    }
                ],
                template: {
                    engine: "json",
                    message: "Message JSON OBJECT: {jsonobject} done!"
                },
                logtarget: {
                    file: "/tmp/demo2.log",
                },
                status: 0
            },{
                id: "demo3",
                frequency: 0.5,
                template: {
                    engine: "fix",
                    message: "You can win if you want"
                },
                logtarget: {
                    file: "/tmp/demo3.log",
                },
                status: 0
            }
        ]
      },
      {
        url: "http://192.168.56.72:17779",
        workers: [
            {
                id: "demo1",
                frequency: 0.05,
                model: [
                    {
                        name: "var1",
                        type: "boolean"
                    }, {
                        name: "var2",
                        type: "integer",
                        min: 5,
                        max: 1000,
                    }, {
                        name: "var3",
                        type: "float",
                        min: 0.0,
                        max: 500
                    }, {
                        name: "var4",
                        type: "string",
                        min: 10,
                        max: 60
                    }, {
                        name: "var6",
                        type: "choice",
                        list: [
                            "String 1",
                            "String 2",
                            "String 3",
                            "String 4"
                        ]
                    }, {
                        name: "var5",
                        type: "datetime"
                    }
                ],
                template: {
                    engine: "string-format",
                    message: "Message include {var6}, '{var1}', {var2} and {var3}"
                },
                logtarget: {
                    file: "/tmp/demo1.log",
                },
                status: 0
            },{
                id: "demo2",
                frequency: 0.05,
                model: [
                    {
                        name: "phone",
                        type: "choice",
                        list: [
                            "+84912345678",
                            "+84921345679",
                            "+84912345676",
                            "+84912345645"
                        ]
                    }, {
                        name: "verifyCode",
                        type: "choice",
                        list: [ "2385", "3487", "0923", "1288"]
                    }, {
                        name: "password",
                        type: "choice",
                        list: ["s3cr3t", "myg0d", "web4pp"]
                    }
                ],
                template: {
                    engine: "json",
                    message: "Message JSON OBJECT: {jsonobject} done!"
                },
                logtarget: {
                    file: "/tmp/demo2.log",
                },
                status: 0
            },{
                id: "demo3",
                frequency: 0.5,
                template: {
                    engine: "fix",
                    message: "You can win if you want"
                },
                logtarget: {
                    file: "/tmp/demo3.log",
                },
                status: 0
            }
        ]
    }
];

var clientManager = null;
window.addEventListener('load', function() {
  clientManager = new ClientManager({agents: localagents});
});
