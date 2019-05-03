var algrmMonitor = algrmMonitor || {};

(function() {
	/* *******************************************************
	 * This code was inspired from:
	 * https://www.awwwards.com/build-a-simple-javascript-app-the-mvc-way.html
	 */
	 
	/* ================================================================= */	 
	/* 
	 *                           cpuPanelView
	 */
	algrmMonitor.cpuPanelView = function (model) {
		this.model = model;
		
		// here should be event dispachers for events coming from the view

		this.init();
	};

	algrmMonitor.cpuPanelView.prototype = {
		init: function () {
			this.createChildren()
			    .setupHandlers()
				.enable();
		},
		
		createChildren: function () {
			// cache the document object
			this.$cpuPanel = null;
			this.$cpuUtilGraphPanel = null;
			return this;
		},


		setupHandlers: function () {
			this.newPanelHandler = this.newPanel.bind(this);
			this.updateCPUInfoHandler = this.updateCPUInfo.bind(this);
			this.updateCPUDetailsHandler = this.updateCPUDetails.bind(this);
			this.updateOnlineStatusHandler = this.updateOnlineStatus.bind(this);

			/**
			Handlers from Event Dispatcher
			*/

			return this;
		},

		enable: function () {
			this.model.newPanelEvent.attach(this.newPanelHandler);
			this.model.updateCPUInfoEvent.attach(this.updateCPUInfoHandler);
			this.model.updateCPUDetailsEvent.attach(this.updateCPUDetailsHandler);
			this.model.updateOnlineStatusEvent.attach(this.updateOnlineStatusHandler);

			/**
			 * Event Dispatcher
			 */

			return this;
		},
		
		strs: {
			cpuPanelId: "cpuPanel_<id>",
			cpuPanelTitleId: "cpuPanelTitle_<id>",
			cpuUtilGraphPanelId: "cpuUtilGraphPanel_<id>",
			cpuUtilGraphSVGId: "cpuUtilGraphSVG_<id>",
			lineUtilTitle: "Util",
			lineMemTitle: "Mem",
			htmlPanel: '<div id="<cpuPanelId>" class="cpu-panel"></div>',
			htmlPanelStructure: '<h1 id="<cpuPanelTitleId>" class="cpu-title"><cpuName></h1> \
								 <div id="<cpuUtilGraphPanelId>"  class="cpu-graph"> \
								 <svg id="<cpuUtilGraphSVGId>" class="cpu-svg"></svg> \
								 </div>',
			urlTemplate: 'http://<computer>:<port>',
		},
		
		buildPanel: function() {
			this.cpuPanelId = this.strs.cpuPanelId.replace("<id>", this.model.id);
			if (!this.$cpuPanel) {
				var html = this.strs.htmlPanel.replace("<cpuPanelId>", this.cpuPanelId);
				$("#algrmDashboard").append(html);
				this.$cpuPanel = $("#" + this.cpuPanelId);
			}
			else {
				this.$cpuPanel.empty();
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
		
		buildPanelStructure: function() {
			this.cpuPanelTitleId = this.strs.cpuPanelTitleId.replace("<id>", this.model.id);
			this.cpuUtilGraphPanelId = this.strs.cpuUtilGraphPanelId.replace("<id>", this.model.id);
			this.cpuUtilGraphSVGId = this.strs.cpuUtilGraphSVGId.replace("<id>", this.model.id);
			var html = this.strs.htmlPanelStructure
				.replace("<cpuPanelTitleId>", this.cpuPanelTitleId)
				.replace("<cpuUtilGraphPanelId>", this.cpuUtilGraphPanelId)
				.replace("<cpuName>", this.model.getCPUInfo().cpuName)
				.replace('<cpuIdx>', this.model.getCPUInfo().cpuIdx)
				.replace("<cpuUtilGraphSVGId>", this.cpuUtilGraphSVGId)
			this.$cpuPanel.html(html);
			this.$cpuUtilGraphPanel = $("#" + this.cpuUtilGraphPanelId);
			this.svgUtil = this.buildSVG(d3.select("#" + this.cpuUtilGraphSVGId), "Performance", [ this.strs.lineUtilTitle, this.strs.lineMemTitle ], 100);
		},
		
		updateSVGWithData(svg, title, data, x, y) {
			var id = this.title2Id(title);
			var valueline = d3.svg.line().x(function(d) { return x(d[0]); }).y(function(d) { return y(d[1]); });
			svg.select("#" + id).attr("d", valueline(data));
		},
		
		updateUtilGraph: function() {
			var gtime = this.model.cpuDetails.graph_time;
			var gutil = this.model.cpuDetails.graph_util;
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
			var gtime = this.model.cpuDetails.graph_time;
			var gmem = this.model.cpuDetails.graph_mem;
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
		
		updateOnlineStatus: function() {
		},

		/* -------------------- Handlers From Event Dispatcher ----------------- */
		newPanel: function() {
			this.buildPanel();
		},
		
		updateCPUInfo: function() {
			this.buildPanelStructure();
		},
		
		updateCPUDetails: function() {
			this.updateUtilGraph();
			this.updateMemGraph();
		}
	};

})();
