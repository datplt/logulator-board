(function(exports, _) {

  var LogulatorChart = exports.LogulatorChart = function(params) {
    var self = this;
    var ctx = {};

    ctx.container = params.containerId;
    ctx.id = params.id || Guid.raw();
    ctx.titleText = params.titleText || '';
    ctx.ticks = params.ticks || 20;
    ctx.tickDuration = params.tickDuration || 1000;
    ctx.minValue = params.minValue || 0;
    ctx.maxValue = params.maxValue || 100;
    ctx.boxWidth = d3.select(ctx.container).node().getBoundingClientRect().width;
    ctx.boxHeight = 280;
    ctx.margin = { top: 50, right: 40, bottom: 50, left: 80 };
    ctx.width = ctx.boxWidth - ctx.margin.left - ctx.margin.right;
    ctx.height = ctx.boxHeight - ctx.margin.top - ctx.margin.bottom;
    ctx.xText = params.horizontalText || '';
    ctx.yText = params.verticalText || '';
    ctx.dataSeries = [];

    self.dataEntries = {};

    self.initialize = function (opts) {
      opts = opts || {};

      ctx.ticks = opts.ticks || ctx.ticks;
      ctx.tickDuration = opts.tickDuration || ctx.tickDuration;
      ctx.minValue = opts.minValue || ctx.minValue;
      ctx.maxValue = opts.maxValue || ctx.maxValue;

      d3.select('#chart-' + ctx.id).remove();

      ctx.svg = d3.select(ctx.container).append("svg")
        .attr("id", 'chart-' + ctx.id)
        .attr("width", ctx.boxWidth)
        .attr("height", ctx.boxHeight)
        .append("g")
        .attr("transform", "translate(" + ctx.margin.left + "," + ctx.margin.top + ")");

      //  Use Clipping to hide chart mechanics
      ctx.svg.append("defs").append("clipPath")
        .attr("id", "clip-" + ctx.id)
        .append("rect")
        .attr("width", ctx.width)
        .attr("height", ctx.height);

      // Generate colors from DataSeries Names
      ctx.color = d3.scale.category10();
      ctx.color.domain(ctx.dataSeries.map(function (d) { return d.Name; }));

      // Define xscale, yscale
      ctx.xScale = d3.scale.linear().domain([0, ctx.ticks]).range([0, ctx.width]);
      ctx.yScale = d3.scale.linear().domain([ctx.minValue, ctx.maxValue]).range([ctx.height, 0]);

      // Define xAxis, yAxis
      ctx.xAxis = d3.svg.axis()
        .scale(d3.scale.linear().domain([0, ctx.ticks]).range([ctx.width, 0]))
        .orient("bottom");
      ctx.yAxis = d3.svg.axis()
        .scale(ctx.yScale)
        .orient("left");

      // Define Line/Area Chart
      ctx.line = d3.svg.line()
        .interpolate("basis")
        .x(function (d, i) { return ctx.xScale(i-1); })
        .y(function (d) { return ctx.yScale(d.Value); });
      ctx.area = d3.svg.area()
        .interpolate("basis")
        .x(function (d, i) { return ctx.xScale(i-1); })
        .y0(ctx.height)
        .y1(function (d) { return ctx.yScale(d.Value); });

      // Render chart title
      ctx.title = ctx.svg.append("text")
        .attr("id", "title-" + ctx.id)
        .attr("class", "chart-title")
        .style("text-anchor", "middle")
        .text(ctx.titleText)
        .attr("transform", function (d, i) {
          return "translate(" + ctx.width / 2 + "," + -10 + ")";
        });

      // Render xAxis text
      ctx.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + ctx.yScale(ctx.minValue) + ")")
        .call(ctx.xAxis)
        .append("text")
        .attr("id", "xName-" + ctx.id)
        .attr("x", ctx.width / 2)
        .attr("dy", "3em")
        .style("text-anchor", "middle")
        .text(ctx.xText);

      // Render yAxis text
      ctx.svg.append("g")
        .attr("class", "y axis")
        .call(ctx.yAxis)
        .append("text")
        .attr("id", "yName-" + ctx.id)
        .attr("transform", "rotate(-90)")
        .attr("y", 0)
        .attr("x", -ctx.height / 2)
        .attr("dy", "-3em")
        .style("text-anchor", "middle")
        .text(ctx.yText);

      // Render vertical grid lines
      ctx.svg.selectAll(".vline").data(d3.range(ctx.ticks)).enter()
        .append("line")
        .attr("x1", function (d) { return d * (ctx.width / ctx.ticks); })
        .attr("x2", function (d) { return d * (ctx.width / ctx.ticks); })
        .attr("y1", function (d) { return 0; })
        .attr("y2", function (d) { return ctx.height; })
        .style("stroke", "#282C34")
        .style("opacity", .5)
        .attr("clip-path", "url(#clip-" + ctx.id + ")")
        .attr("transform", "translate(" + (ctx.width / ctx.ticks) + "," + 0 + ")");

      // Render horizontal grid lines
      ctx.svg.selectAll(".hline").data(d3.range(ctx.ticks)).enter()
        .append("line")
        .attr("x1", function (d) { return 0; })
        .attr("x2", function (d) { return ctx.width; })
        .attr("y1", function (d) { return d * (ctx.height / (ctx.maxValue / 10)); })
        .attr("y2", function (d) { return d * (ctx.height / (ctx.maxValue / 10)); })
        .style("stroke", "#282C34")
        .style("opacity", .5)
        .attr("clip-path", "url(#clip-" + ctx.id + ")")
        .attr("transform", "translate(" + 0 + "," + 0 + ")");

      // Bind dataSeries to chart
      ctx.series = ctx.svg.selectAll(".Series")
        .data(ctx.dataSeries)
        .enter().append("g")
        .attr("clip-path", "url(#clip-" + ctx.id + ")")
        .attr("class", "Series");

      //  Draw path from Series Data Points
      ctx.path = ctx.series.append("path")
        .attr("class", "area")
        .attr("d", function (d) { return ctx.area(d.Data); })
        .style("fill", function (d) { return ctx.color(d.Name); })
        .style("fill-opacity", .25)
        .style("stroke", function (d) { return ctx.color(d.Name); });

      // Render the legends
      ctx.legend = ctx.svg.selectAll(".Legend")
        .data(ctx.dataSeries)
        .enter().append("g")
        .attr("class", "Legend");
      ctx.legend.append("circle")
        .attr("r", 4)
        .style("fill", function (d) { return ctx.color(d.Name); })
        .style("fill-opacity", .5)
        .style("stroke", function (d) { return ctx.color(d.Name); })
        .attr("transform", function (d, i) { return "translate(" + (i * 60) + "," + (ctx.height + 36) + ")"; });
      ctx.legend.append("text")
        .text(function (d) { return d.Name; })
        .attr("dx", "0.5em")
        .attr("dy", "0.25em")
        .style("text-anchor", "start")
        .attr("transform", function (d, i) {
          return "translate(" + (i * 60 + 2) + "," + (ctx.height + 37) + ")";
        });

      self.start();
    };

    self.start = function () {
      ctx.firstTick = new Date();
      ctx.lastTick = new Date();
      ctx.state = 'running';
      self.tick(0);
    };

    self.stop = function() {
      ctx.state = 'stopped';
    };

    self.tick = function (id) {
      if (ctx.state != 'running') return;
      ctx.thisTick = new Date();
      var elapsed = parseInt(ctx.thisTick - ctx.lastTick);
      var elapsedTotal = parseInt(ctx.lastTick - ctx.firstTick);
      if (elapsed < 900 && elapsedTotal > 0) {
        ctx.lastTick = ctx.thisTick;
        return;
      }
      if (id < ctx.dataSeries.length - 1 && elapsedTotal > 0) {
        return;
      }
      ctx.lastTick = ctx.thisTick;

      //Add new values
      for (i in ctx.dataSeries) {
        ctx.dataSeries[i].Data.push({ Value: self.dataEntries[ctx.dataSeries[i].Name] });
        //Backfill missing values
        while (ctx.dataSeries[i].Data.length -1<ctx.ticks+3 ) {
          ctx.dataSeries[i].Data.unshift({ Value: 0 })
        }
      }

      d3.select("#yName-" + ctx.id).text(ctx.yText);
      d3.select("#xName-" + ctx.id).text(ctx.xText);
      d3.select("#title-" + ctx.id).text(ctx.titleText);

      ctx.path
        .attr("d", function (d) { return ctx.area(d.Data); })
        .attr("transform", null)
        .transition()
        .duration(ctx.tickDuration)
        .ease("linear")
        .attr("transform", "translate(" + ctx.xScale(-1) + ",0)")
        .each("end", function (d, i) { self.tick(i); });

      //Remove oldest values
      for (i in ctx.dataSeries) {
        ctx.dataSeries[i].Data.shift();
      }
    };

    self.addSeries = function (SeriesName) {
        self.dataEntries[SeriesName] = 0;
        ctx.dataSeries.push({ Name: SeriesName, Data: [{ Value: 0}] });
        self.initialize();
    };
  };
})(this, _);
