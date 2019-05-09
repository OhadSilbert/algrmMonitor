var algrmMonitor = algrmMonitor || {};

(function() {
	/* *******************************************************
	 * This code was inspired from:
	 * https://www.awwwards.com/build-a-simple-javascript-app-the-mvc-way.html
	 */
	 
	/* ================================================================= */	 
	/* 
	 *                           panelView
	 */
	algrmMonitor.panelView = function (model) {
		this.model = model;
		
		// here should be event dispachers for events coming from the view

		this.init();
	};

	algrmMonitor.panelView.prototype = {
		init: function () {
			this.createChildren()
			    .setupHandlers()
				.enable();
		},
		
		createChildren: function () {
			// cache the document object
			this.$panel = null;
			this.$utilGraphPanel = null;
			return this;
		},


		setupHandlers: function () {
			this.newPanelHandler = this.newPanel.bind(this);
			this.updateInfoHandler = this.updateInfo.bind(this);
			this.updateDetailsHandler = this.updateDetails.bind(this);
			this.updateOnlineStatusHandler = this.updateOnlineStatus.bind(this);

			/**
			Handlers from Event Dispatcher
			*/

			return this;
		},

		enable: function () {
			this.model.newPanelEvent.attach(this.newPanelHandler);
			this.model.updateInfoEvent.attach(this.updateInfoHandler);
			this.model.updateDetailsEvent.attach(this.updateDetailsHandler);
			this.model.updateOnlineStatusEvent.attach(this.updateOnlineStatusHandler);

			/**
			 * Event Dispatcher
			 */

			return this;
		},
		
		strs: {
			panelId: "panel_<id>",
			utilGraphPanelId: "utilGraphPanel_<id>",
			utilGraphSVGId: "utilGraphSVG_<id>",
			lineUtilTitle: "Util",
			lineMemTitle: "Mem",
			htmlPanel: '<div id="<panelId>" class="device-panel"></div>',
			htmlPanelStructure: '<htmlDeviceSpecificTitle> \
								 <div id="<utilGraphPanelId>"  class="device-graph"> \
								 <svg id="<utilGraphSVGId>" class="device-svg"></svg> \
                                 </div> \
                                 <htmlDeviceSpecificDashboard>',
			urlTemplate: 'http://<computer>:<port>',
		},
		
		buildPanel: function() {
			this.panelId = this.strs.panelId.replace("<id>", this.model.id);
			if (!this.$panel) {
				var html = this.strs.htmlPanel.replace("<panelId>", this.panelId);
				$("#algrmDashboard").append(html);
				this.$panel = $("#" + this.panelId);
			}
			else {
				this.$panel.empty();
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
			this.utilGraphPanelId = this.strs.utilGraphPanelId.replace("<id>", this.model.id);
			this.utilGraphSVGId = this.strs.utilGraphSVGId.replace("<id>", this.model.id);
            var html = this.strs.htmlPanelStructure
                .replace("<htmlDeviceSpecificTitle>", this.getHtmlDeviceSpecificTitle())
				.replace("<utilGraphPanelId>", this.utilGraphPanelId)
				.replace("<utilGraphSVGId>", this.utilGraphSVGId)
                .replace("<htmlDeviceSpecificDashboard>", this.getHtmlDeviceSpecificDashboard())
			this.$panel.html(html);
			this.$utilGraphPanel = $("#" + this.utilGraphPanelId);
            this.svgUtil = this.buildSVG(d3.select("#" + this.utilGraphSVGId), "Performance", [ this.strs.lineUtilTitle, this.strs.lineMemTitle ], 100);
            this.cachePanelSpecificStructure();
        },
        
        getHtmlDeviceSpecificTitle: function() {
            // return html of the title
        },

        getHtmlDeviceSpecificDashboard: function() {
            // return html of the data dashboard
        },

        cachePanelSpecificStructure: function() {
            // cache DOM elements
        },

		updateSVGWithData: function(svg, title, data, x, y) {
			var id = this.title2Id(title);
			var valueline = d3.svg.line().x(function(d) { return x(d[0]); }).y(function(d) { return y(d[1]); });
			svg.select("#" + id).attr("d", valueline(data));
        },
        
        updateGraph: function(svg, title, x, y, min_x) {
			var n = x.length;
			var end_x = x[n - 1];
			var data = [];
			for (var i = 0; i < n; i++) {
				var dx = x[i] - end_x;
				if (dx > min_x) {
					data.push([dx, y[i]]);
				}
			}
			this.updateSVGWithData(svg, title, data, svg.x, svg.y);
        },
		
		updateUtilGraph: function() {
            this.updateGraph(this.svgUtil, this.strs.lineUtilTitle,
                this.model.details.graph_time, this.model.details.graph_util, -60);
        },
        
        updateMemGraph: function() {
            this.updateGraph(this.svgUtil, this.strs.lineMemTitle,
                this.model.details.graph_time, this.model.details.graph_mem, -60);
		},
		
		updateOnlineStatus: function() {
		},

		/* -------------------- Handlers From Event Dispatcher ----------------- */
		newPanel: function() {
			this.buildPanel();
		},
		
		updateInfo: function() {
			this.buildPanelStructure();
		},
		
		updateDetails: function() {
			this.updateUtilGraph();
			this.updateMemGraph();
		}
	};

})();
