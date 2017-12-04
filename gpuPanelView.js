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
			this.$gpuMemGraphPanel = null;
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
			gpuMemGraphPanelId: "gpuMemGraphPanel_<id>",
			gpuProcessPanelId: "gpuProcessPanel_<id>",
			gpuProcessTableId: "gpuProcessTable_<id>",
			gpuUtilGraphSVGId: "gpuUtilGraphSVG_<id>",
			gpuMemGraphSVGId: "gpuMemGraphSVG_<id>",
			htmlPanel: '<div id="<gpuPanelId>" class="gpu-panel"></div>',
			htmlPanelStructure: '<h1 id="<gpuPanelTitleId>" class="gpu-title"><gpuName> (<gpuIdx>)</h1> \
								 <div id="<gpuUtilGraphPanelId>"  class="gpu-graph"> \
								 <svg id="<gpuUtilGraphSVGId>" class="gpu-svg"></svg> \
								 </div> \
								 <div id="<gpuMemGraphPanelId>"  class="gpu-graph"> \
								 <svg id="<gpuMemGraphSVGId>" class="gpu-svg"></svg> \
								 </div> \
								 <div id="<gpuProcessPanelId>"  class="gpu-process"> \
								 <table id="<gpuProcessTableId>" class="gpu-process-table">\
								 <thead><tr><th>PID</th><th>Process</th><th>User</th><th>Mem Usage [MB]</th></tr></thead>\
								 <tbody></tbody></table>\
								 </div>',
			htmlProcessTableRow: '<tr><td><pid></td><td><cmd></td><td><username></td><td><mem></td></tr>'
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
		
		buildSVG: function(svg) {
			var margin = {top: 30, right: 20, bottom: 30, left: 50};
			var width = 450 - margin.left - margin.right;
			var height = 150 - margin.top - margin.bottom;
			var x = d3.scale.linear().range([0, width]);
			var y = d3.scale.linear().range([height, 0]);
			x.domain([-60, 0]);
			y.domain([0, 100]);
			var xAxis = d3.svg.axis().scale(x)
									 .orient("bottom").ticks(5);
			var yAxis = d3.svg.axis().scale(y)
									 .orient("left").ticks(5);
			svg = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
			svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis);
			svg.append("g").attr("class", "y axis").call(yAxis);
		},
		
		buildPanelStructure: function() {
			this.gpuPanelTitleId = this.strs.gpuPanelTitleId.replace("<id>", this.model.id);
			this.gpuUtilGraphPanelId = this.strs.gpuUtilGraphPanelId.replace("<id>", this.model.id);
			this.gpuMemGraphPanelId = this.strs.gpuMemGraphPanelId.replace("<id>", this.model.id);
			this.gpuProcessPanelId = this.strs.gpuProcessPanelId.replace("<id>", this.model.id);
			this.gpuProcessTableId = this.strs.gpuProcessTableId.replace("<id>", this.model.id);
			this.gpuUtilGraphSVGId = this.strs.gpuUtilGraphSVGId.replace("<id>", this.model.id);
			this.gpuMemGraphSVGId = this.strs.gpuMemGraphSVGId.replace("<id>", this.model.id);
			var html = this.strs.htmlPanelStructure
				.replace("<gpuPanelTitleId>", this.gpuPanelTitleId)
				.replace("<gpuUtilGraphPanelId>", this.gpuUtilGraphPanelId)
				.replace("<gpuMemGraphPanelId>", this.gpuMemGraphPanelId)
				.replace("<gpuProcessPanelId>", this.gpuProcessPanelId)
				.replace("<gpuName>", this.model.getGPUInfo().gpuName)
				.replace('<gpuIdx>', this.model.getGPUInfo().gpuIdx)
				.replace("<gpuProcessTableId>", this.gpuProcessTableId)
				.replace("<gpuUtilGraphSVGId>", this.gpuUtilGraphSVGId)
				.replace("<gpuMemGraphSVGId>", this.gpuMemGraphSVGId);
			this.$gpuPanel.html(html);
			this.$gpuUtilGraphPanel = $("#" + this.gpuUtilGraphPanelId);
			this.$gpuMemGraphPanel = $("#" + this.gpuMemGraphPanelId);
			this.$gpuProcessPanel = $("#" + this.gpuProcessPanelId);
			this.$gpuProcessTable = $("#" + this.gpuProcessTableId + " tbody");
			this.svgUtil = d3.select("#" + this.gpuUtilGraphSVGId);
			this.svgMem = d3.select("#" + this.gpuMemGraphSVGId);
			this.buildSVG(this.svgUtil);
			this.buildSVG(this.svgMem);
		},
		
		buildProcessTable: function() {
			var gpuDetails = this.model.getGPUDetails();
			var tablebody = "";
			for (var i in this.model.gpuDetails.procs) {
				var proc = this.model.getGPUDetails().procs[i];
				var usedGpuMemoryPercent = 100*proc.usedGpuMemory/gpuDetails.memTotal;
				var usedGpuMemory = proc.usedGpuMemory/1024/1024 + ' (' + usedGpuMemoryPercent + '%)';
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
		}

	};

})();
