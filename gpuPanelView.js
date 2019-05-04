var algrmMonitor = algrmMonitor || {};

(function() {
	/* *******************************************************
	 * This code was inspired from:
	 * https://www.awwwards.com/build-a-simple-javascript-app-the-mvc-way.html
	 */
	 
	/* ================================================================= */	 
	/* 
	 *                           gpuPanelView
	 */
	algrmMonitor.gpuPanelView = function (model) {
		this.model = model;
		
		// here should be event dispachers for events coming from the view

		this.init();
	};

	algrmMonitor.gpuPanelView.prototype = {
		init: function () {
			this.createChildren()
			    .setupHandlers()
				.enable();
		},
		
		createChildren: function () {
			// cache the document object
			this.$gpuPanel = null;
			this.$gpuUtilGraphPanel = null;
			this.$gpuXGraphPanel = null;
			this.$gpuProcessPanel = null;
			return this;
		},


		setupHandlers: function () {
			this.newPanelHandler = this.newPanel.bind(this);
			this.updateGPUInfoHandler = this.updateGPUInfo.bind(this);
			this.updateGPUDetailsHandler = this.updateGPUDetails.bind(this);
			this.updateOnlineStatusHandler = this.updateOnlineStatus.bind(this);

			/**
			Handlers from Event Dispatcher
			*/

			return this;
		},

		enable: function () {
			this.model.newPanelEvent.attach(this.newPanelHandler);
			this.model.updateGPUInfoEvent.attach(this.updateGPUInfoHandler);
			this.model.updateGPUDetailsEvent.attach(this.updateGPUDetailsHandler);
			this.model.updateOnlineStatusEvent.attach(this.updateOnlineStatusHandler);

			/**
			 * Event Dispatcher
			 */

			return this;
		},
		
		strs: {
			gpuPanelId: "gpuPanel_<id>",
			gpuPanelTitleId: "gpuPanelTitle_<id>",
			gpuUtilGraphPanelId: "gpuUtilGraphPanel_<id>",
			gpuXGraphPanelId: "gpuXGraphPanel_<id>",
			gpuProcessPanelId: "gpuProcessPanel_<id>",
			gpuProcessTableId: "gpuProcessTable_<id>",
			gpuUtilGraphSVGId: "gpuUtilGraphSVG_<id>",
			gpuTempGaugeId: "gpuTempGaugeId_<id>",
			gpuXGraphSVGId: "gpuXGraphSVG_<id>",
			lineUtilTitle: "Util",
			lineMemTitle: "Mem",
			lineRxTitle: "rx",
			lineTxTitle: "tx",
			htmlPanel: '<div id="<gpuPanelId>" class="device-panel"></div>',
			htmlPanelStructure: '<div class="gpu-title-box"> \
			                     <div class="gpu-title-chart"> \
								 <div id="<gpuTempGaugeId>" class="gpu-gauge"></div> \
								 </div> \
								 <div class="gpu-title-text"> \
								 <h1 id="<gpuPanelTitleId>" class="device-title"><gpuName> (<gpuIdx>)</h1> \
								 </div> \
								 <div class="gpu-title-chart"> </div> \
								 </div> \
								 <div id="<gpuUtilGraphPanelId>"  class="device-graph"> \
								 <svg id="<gpuUtilGraphSVGId>" class="device-svg"></svg> \
								 </div> \
								 <div id="<gpuXGraphPanelId>"  class="device-graph"> \
								 <svg id="<gpuXGraphSVGId>" class="device-svg"></svg> \
								 </div> \
								 <div id="<gpuProcessPanelId>"  class="device-process"> \
								 <table id="<gpuProcessTableId>" class="device-process-table">\
								 <thead><tr><th>PID</th><th>Process</th><th>User</th><th>Mem Usage [MB]</th></tr></thead>\
								 <tbody></tbody></table>\
								 </div>',
			htmlProcessTableRow: '<tr><td><pid></td><td><cmd></td><td><username></td><td><mem></td></tr>',
			urlTemplate: 'http://<computer>:<port>',
		},
		
		buildPanel: function() {
			this.gpuPanelId = this.strs.gpuPanelId.replace("<id>", this.model.id);
			if (!this.$gpuPanel) {
				var html = this.strs.htmlPanel.replace("<gpuPanelId>", this.gpuPanelId);
				$("#algrmDashboard").append(html);
				this.$gpuPanel = $("#" + this.gpuPanelId);
			}
			else {
				this.$gpuPanel.empty();
			}
		},
		
		title2Id: function(title) {
			return title + "_" + this.model.id;
		},
		
		buildSVG: function(svg, title, lineTitles, yMax) {
			var margin = {top: 30, right: 40, bottom: 30, left: 50};
			var width = 450 - margin.left - margin.right;
			var height = 150 - margin.top - margin.bottom;
			var x = d3.scale.linear().range([0, width]);
			var y = d3.scale.linear().range([height, 0]);
			x.domain([-60, 0]);
			y.domain([0, yMax]);
			var xAxis = d3.svg.axis().scale(x)
									 .orient("bottom").ticks(5);
			var yAxis = d3.svg.axis().scale(y)
									 .orient("left").ticks(5);
			svg = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
			svg.append("text").attr("class", "graph-title")
							  .attr("x", (width / 2))
							  .attr("y", 0 - (margin.top / 2))
							  .text(title);
			for (var i in lineTitles) {
				svg.append("path").attr("class", "line-" + i).attr("id", this.title2Id(lineTitles[i]));
				svg.append("text").attr("class", "text-line-" + i).attr("id", "text" + this.title2Id(lineTitles[i]))
								  .attr("x", (width + margin.right - 5))
								  .attr("y", height / 2 - 8 + i * 16)
								  .attr("text-anchor", "end")
								  .text(lineTitles[i]);
			}
			svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis);
			svg.append("g").attr("class", "y axis").call(yAxis);
			svg.x = x;
			svg.y = y;
			return svg;
		},

		buildGauge: function(member, gauge, title, val, valThreshold) {
			var panel = this;
			google.charts.load('current', {'packages':['gauge']});
			google.charts.setOnLoadCallback( function() {
				chart = panel.buildGaugeCallback(member, gauge, title, val, valThreshold)
			});
		},

		buildGaugeCallback: function(member, gauge, title, val, valThreshold) {
			var data = google.visualization.arrayToDataTable([
				['Label', 'Value'],
				[title, val]]);
	  
			  var options = {
				width: 300, height: 90,
				redFrom: valThreshold, redTo: 120,
				minorTicks: 5
			  };
			
			this[member] = new google.visualization.Gauge(gauge[0][0]);

			this[member].draw(data, options);
		},
		
		buildPanelStructure: function() {
			this.gpuPanelTitleId = this.strs.gpuPanelTitleId.replace("<id>", this.model.id);
			this.gpuUtilGraphPanelId = this.strs.gpuUtilGraphPanelId.replace("<id>", this.model.id);
			this.gpuTempGaugeId = this.strs.gpuTempGaugeId.replace("<id>", this.model.id);
			this.gpuXGraphPanelId = this.strs.gpuXGraphPanelId.replace("<id>", this.model.id);
			this.gpuProcessPanelId = this.strs.gpuProcessPanelId.replace("<id>", this.model.id);
			this.gpuProcessTableId = this.strs.gpuProcessTableId.replace("<id>", this.model.id);
			this.gpuUtilGraphSVGId = this.strs.gpuUtilGraphSVGId.replace("<id>", this.model.id);
			this.gpuXGraphSVGId = this.strs.gpuXGraphSVGId.replace("<id>", this.model.id);
			var html = this.strs.htmlPanelStructure
				.replace("<gpuPanelTitleId>", this.gpuPanelTitleId)
				.replace("<gpuUtilGraphPanelId>", this.gpuUtilGraphPanelId)
				.replace("<gpuXGraphPanelId>", this.gpuXGraphPanelId)
				.replace("<gpuProcessPanelId>", this.gpuProcessPanelId)
				.replace("<gpuName>", this.model.getGPUInfo().gpuName)
				.replace('<gpuIdx>', this.model.getGPUInfo().gpuIdx)
				.replace("<gpuProcessTableId>", this.gpuProcessTableId)
				.replace("<gpuUtilGraphSVGId>", this.gpuUtilGraphSVGId)
				.replace("<gpuXGraphSVGId>", this.gpuXGraphSVGId)
				.replace("<gpuTempGaugeId>", this.gpuTempGaugeId);
			this.$gpuPanel.html(html);
			this.$gpuUtilGraphPanel = $("#" + this.gpuUtilGraphPanelId);
			this.$gpuXGraphPanel = $("#" + this.gpuXGraphPanelId);
			this.$gpuProcessPanel = $("#" + this.gpuProcessPanelId);
			this.$gpuProcessTable = $("#" + this.gpuProcessTableId + " tbody");
			this.svgUtil = this.buildSVG(d3.select("#" + this.gpuUtilGraphSVGId), "Performance", [ this.strs.lineUtilTitle, this.strs.lineMemTitle ], 100);
			this.svgX = this.buildSVG(d3.select("#" + this.gpuXGraphSVGId), "PCI", [this.strs.lineRxTitle, this.strs.lineTxTitle], 15);
			this.gaugeTemp = null;
			this.buildGauge("gaugeTemp", d3.select("#" + this.gpuTempGaugeId), "Temp", this.model.getGPUInfo().temperature, this.model.getGPUInfo().temperatureThreshold);
		},
		
		buildProcessTable: function() {
			var gpuDetails = this.model.getGPUDetails();
			var tablebody = "";
			for (var i in this.model.gpuDetails.procs) {
				var proc = this.model.getGPUDetails().procs[i];
				var usedGpuMemoryPercent = 100*proc.usedGpuMemory/gpuDetails.memTotal;
				var usedGpuMemory = proc.usedGpuMemory/1024/1024 + ' (' + usedGpuMemoryPercent.toFixed(0) + '%)';
				if (proc.usedGpuMemory < 0) {
					usedGpuMemory = "?";
				}
				tablebody += this.strs.htmlProcessTableRow
					.replace('<pid>', proc.pid)
					.replace('<cmd>', proc.cmd)
					.replace('<username>', proc.username)
					.replace('<mem>', usedGpuMemory);
			}
			this.$gpuProcessTable.html(tablebody);
		},
		
		updateSVGWithData(svg, title, data, x, y) {
			var id = this.title2Id(title);
			var valueline = d3.svg.line().x(function(d) { return x(d[0]); }).y(function(d) { return y(d[1]); });
			svg.select("#" + id).attr("d", valueline(data));
		},
		
		updateUtilGraph: function() {
			var gtime = this.model.gpuDetails.graph_time;
			var gutil = this.model.gpuDetails.graph_util;
			var n = gtime.length;
			var end_time = gtime[n - 1];
			var data = [];
			for (var i = 0; i < n; i++) {
				var ltime = gtime[i] - end_time;
				if (ltime > -60) {
					data.push([ltime, gutil[i]]);
				}
			}
			this.updateSVGWithData(this.svgUtil, this.strs.lineUtilTitle, data, this.svgUtil.x, this.svgUtil.y);
		},

		updateMemGraph: function() {
			var gtime = this.model.gpuDetails.graph_time;
			var gmem = this.model.gpuDetails.graph_mem;
			var n = gtime.length;
			var end_time = gtime[n - 1];
			var data = [];
			for (var i = 0; i < n; i++) {
				var ltime = gtime[i] - end_time;
				if (ltime > -60) {
					data.push([ltime, gmem[i]]);
				}
			}
			this.updateSVGWithData(this.svgUtil, this.strs.lineMemTitle, data, this.svgUtil.x, this.svgUtil.y);
		},
		
		updateRxGraph: function() {
			var gtime = this.model.gpuDetails.graph_time;
			var grx = this.model.gpuDetails.graph_rx;
			var n = gtime.length;
			var end_time = gtime[n - 1];
			var data = [];
			for (var i = 0; i < n; i++) {
				var ltime = gtime[i] - end_time;
				if (ltime > -60) {
					data.push([ltime, grx[i]]);
				}
			}
			this.updateSVGWithData(this.svgX, this.strs.lineRxTitle, data, this.svgX.x, this.svgX.y);
		},
		
		updateTxGraph: function() {
			var gtime = this.model.gpuDetails.graph_time;
			var gtx = this.model.gpuDetails.graph_tx;
			var n = gtime.length;
			var end_time = gtime[n - 1];
			var data = [];
			for (var i = 0; i < n; i++) {
				var ltime = gtime[i] - end_time;
				if (ltime > -60) {
					data.push([ltime, gtx[i]]);
				}
			}
			this.updateSVGWithData(this.svgX, this.strs.lineTxTitle, data, this.svgX.x, this.svgX.y);
		},

		updateGaugeTemp: function() {
			if (this.gaugeTemp) {
				var data = google.visualization.arrayToDataTable([
					['Label', 'Value'],
					["Temp", this.model.gpuDetails.temperature]]);
		  
				  var options = {
					width: 300, height: 90,
					redFrom: this.model.gpuDetails.temperatureThreshold, redTo: 120,
					minorTicks: 5
				  };

				this.gaugeTemp.draw(data, options);
			}
		},

		updateOnlineStatus: function() {
			if (this.model.onlineStatus) {
				this.$gpuProcessPanel.removeClass("gpu-process-table-freeze");
			}
			else {
				this.$gpuProcessPanel.addClass("gpu-process-table-freeze");
			}
		},

		/* -------------------- Handlers From Event Dispatcher ----------------- */
		newPanel: function() {
			this.buildPanel();
		},
		
		updateGPUInfo: function() {
			this.buildPanelStructure();
		},
		
		updateGPUDetails: function() {
			this.buildProcessTable();
			this.updateUtilGraph();
			this.updateMemGraph();
			this.updateRxGraph();
			this.updateTxGraph();
			this.updateGaugeTemp();
		}
	};

})();
