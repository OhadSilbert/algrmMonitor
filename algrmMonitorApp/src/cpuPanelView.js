var algrmMonitor = algrmMonitor || {};

(function() {
	/* ================================================================= */	 
	/* 
	 *                           cpuPanelView
	 */
	algrmMonitor.cpuPanelView = function (model) {
		algrmMonitor.panelView.call(this, model);
	};

	algrmMonitor.cpuPanelView.prototype = Object.create(algrmMonitor.panelView.prototype);
	algrmMonitor.cpuPanelView.prototype.constructor = algrmMonitor.cpuPanelView;

	algrmMonitor.cpuPanelView.prototype.cpuStrs = {
		cpuPanelTitleId: "cpuPanelTitle_<id>",
		coresUtilBarGraphSVGId: "coresUtilBarGraphSVG_<id>",
		coresUtilBarGraphTitle: "Cores",
		htmlDeviceSpecificTitle: '<h1 id="<cpuPanelTitleId>" class="device-title"><cpuName></h1>',
		htmlDeviceSpecificDashboard: '<div id="<coresUtilBarGraphSVGId>" class="device-graph"></div>'
	};

	algrmMonitor.cpuPanelView.prototype.getHtmlDeviceSpecificTitle = function() {
		this.cpuPanelTitleId = this.cpuStrs.cpuPanelTitleId.replace("<id>", this.model.id);
		var htmlDeviceSpecificTitle = this.cpuStrs.htmlDeviceSpecificTitle
			.replace("<cpuPanelTitleId>", this.cpuPanelTitleId)
			.replace("<cpuName>",  this.model.getInfo().name)
		return htmlDeviceSpecificTitle;
	};

	algrmMonitor.cpuPanelView.prototype.getHtmlDeviceSpecificDashboard = function() {
		this.coresUtilBarGraphSVGId = this.cpuStrs.coresUtilBarGraphSVGId.replace("<id>", this.model.id);
		var htmlDeviceSpecificDashboard = this.cpuStrs.htmlDeviceSpecificDashboard
			.replace("<coresUtilBarGraphSVGId>", this.coresUtilBarGraphSVGId);
		return htmlDeviceSpecificDashboard;
	};

	algrmMonitor.cpuPanelView.prototype.cachePanelSpecificStructure = function() {
		// cache DOM elements
		this.svgBar = this.buildBarSVG(d3.select("#" + this.coresUtilBarGraphSVGId), "cores", this.model.info.ncores, 100);
	};

	algrmMonitor.cpuPanelView.prototype.buildBarSVG = function(svg, title, nBars, xMax) {
		var data = [];
		var i = 0;
		for (i = 0; i < nBars; i++) {
			data.push({"name": i.toString(), 
				   "value": 0});
		} 
		
		//set up svg using margin conventions - we'll need plenty of room on the left for labels
		var margin = {top: 30, right: 40, bottom: 30, left: 50};  // var margin = {top: 15, right: 25, bottom: 15, left: 60 }; 
		var width = 450 - margin.left - margin.right;
		var height = Math.min(350 - margin.top - margin.bottom, 10 * nBars);
		svg = svg.append("svg").attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")"); 
		var x = d3.scale.linear()
			.range([0, width])
			.domain([0, xMax]); 
		var y = d3.scale.ordinal()
			.rangeRoundBands([height, 0], .1)
			.domain(data.map(function (d) { 
				return d.name; 
			})); 
		//make y axis to show bar names 
		var yAxis = d3.svg.axis().scale(y) 
			//no tick marks 
			.tickSize(0)
			//no labels
			.tickFormat("") 
			.orient("left"); 
		var gy = svg.append("g") 
			.attr("class", "y axis") 
			.call(yAxis); 
		var bars = svg.selectAll(".bar") 
			.data(data) 
			.enter() 
			.append("g")

		svg.append("text").attr("class", "graph-title")
			.attr("x", (width / 2))
			.attr("y", 0 - (margin.top / 2))
			.text(title);

		//append rects
		bars.append("rect")
			.attr("class",  function (d) {
				return "bar-" + (parseInt(d.name) % 2).toString();
			})
			.attr("id", function(d) {
				return "core-bar-" + d.name;
			})
			.attr("y", function (d) {
				return y(d.name);
			})
			.attr("height", y.rangeBand() * 0.5)
			.attr("x", 0)
			.attr("width", function (d) {
				return x(d.value);
			});

			/*
		//add a value label to the right of each bar
		bars.append("text")
			.attr("class", function(d) {
				return "text-bar-" + (parseInt(d.name) % 2).toString();
			})
			//y position of the label is halfway down the bar
			.attr("y", function (d) {
				return y(d.name) + y.rangeBand() / 2 + 4;
			})
			//x position is 3 pixels to the right of the bar
			.attr("x", function (d) {
				return x(d.value) + 3;
			})
			.text(function (d) {
				return d.value;
			});
			*/
		return svg;
	};

	algrmMonitor.cpuPanelView.prototype.updateBarSVGWithData = function(svg, data, xMax) {
		var margin = {top: 30, right: 40, bottom: 30, left: 50};  // var margin = {top: 15, right: 25, bottom: 15, left: 60 }; 
		var width = 450 - margin.left - margin.right;
		var x = d3.scale.linear()
			.range([0, width])
			.domain([0, xMax]); 

		var i = 0;
		for (i = 0; i < data.length; i++) {
			d = data[i];
			svg.select("#" + "core-bar-" + d.name).attr("width", x(d.value))
		}
	};

	algrmMonitor.cpuPanelView.prototype.updateCoresUtilBarGraph = function() {
		var data = [];
		var i = 0;
		for (i = 0; i < this.model.getDetails().coresUtil.length; i++) {
			data.push({"name": i.toString(), "value": this.model.getDetails().coresUtil[i]});
		}
		this.updateBarSVGWithData(this.svgBar, data, 100);
	};

	algrmMonitor.cpuPanelView.prototype.updateDetails = function() {
		algrmMonitor.panelView.prototype.updateDetails.call(this);
		this.updateCoresUtilBarGraph();
	};
})();
