var algrmMonitor = algrmMonitor || {};

(function() {
	var isEqual = function (value, other) {

		// Get the value type
		var type = Object.prototype.toString.call(value);
	
		// If the two objects are not the same type, return false
		if (type !== Object.prototype.toString.call(other)) return false;
	
		// If items are not an object or array, return false
		if (['[object Array]', '[object Object]'].indexOf(type) < 0) return false;
	
		// Compare the length of the length of the two items
		var valueLen = type === '[object Array]' ? value.length : Object.keys(value).length;
		var otherLen = type === '[object Array]' ? other.length : Object.keys(other).length;
		if (valueLen !== otherLen) return false;
	
		// Compare two items
		var compare = function (item1, item2) {
	
			// Get the object type
			var itemType = Object.prototype.toString.call(item1);
	
			// If an object or array, compare recursively
			if (['[object Array]', '[object Object]'].indexOf(itemType) >= 0) {
				if (!isEqual(item1, item2)) return false;
			}
	
			// Otherwise, do a simple comparison
			else {
	
				// If the two items are not the same type, return false
				if (itemType !== Object.prototype.toString.call(item2)) return false;
	
				// Else if it's a function, convert to a string and compare
				// Otherwise, just compare
				if (itemType === '[object Function]') {
					if (item1.toString() !== item2.toString()) return false;
				} else {
					if (item1 !== item2) return false;
				}
	
			}
		};
	
		// Compare properties
		if (type === '[object Array]') {
			for (var i = 0; i < valueLen; i++) {
				if (compare(value[i], other[i]) === false) return false;
			}
		} else {
			for (var key in value) {
				if (value.hasOwnProperty(key)) {
					if (compare(value[key], other[key]) === false) return false;
				}
			}
		}
	
		// If nothing failed, return true
		return true;
	
	};
 
	/* ================================================================= */	 
	/* 
	 *                           gpuPanelView
	 */
	algrmMonitor.gpuPanelView = function (model) {
		algrmMonitor.panelView.call(this, model);
	};

	algrmMonitor.gpuPanelView.prototype = Object.create(algrmMonitor.panelView.prototype);
	algrmMonitor.gpuPanelView.prototype.constructor = algrmMonitor.gpuPanelView;

	algrmMonitor.gpuPanelView.prototype.createChildren = function() {
		algrmMonitor.panelView.prototype.createChildren.call(this);
		this.$gpuXGraphPanel = null;
		this.$gpuProcessPanel = null;
		return this;
	};

	algrmMonitor.gpuPanelView.prototype.gpuStrs = {
		gpuPanelTitleId: "gpuPanelTitle_<id>",
		gpuXGraphPanelId: "gpuXGraphPanel_<id>",
		gpuProcessTableId: "gpuProcessTable_<id>",
		gpuTempGaugeId: "gpuTempGaugeId_<id>",
		gpuXGraphSVGId: "gpuXGraphSVG_<id>",
		lineRxTitle: "rx",
		lineTxTitle: "tx",
		htmlDeviceSpecificTitle: '<div class="gpu-title-box"> \
                                  <div class="gpu-title-chart"> \
                                  <div id="<gpuTempGaugeId>" class="gpu-gauge"></div> \
                                  </div> \
                                  <div class="gpu-title-text"> \
                                  <h1 id="<gpuPanelTitleId>" class="device-title"><gpuName> (<gpuIdx>)</h1> \
                                  </div>\
                                  <div class="gpu-title-chart"> </div> \
                                  </div>',
        htmlDeviceSpecificDashboard: '<div id="<gpuXGraphPanelId>"  class="device-graph"> \
                                      <svg id="<gpuXGraphSVGId>" class="device-svg"></svg> \
                                      </div> \
                                      <div id="<gpuProcessTableId>"  class="device-process"> \
                                      </div>'
	};

	algrmMonitor.gpuPanelView.prototype.cssProcessTableClassNames = {
		'headerRow': 'cssProcessHeaderRow',
		'tableRow': 'cssProcessTableRow',
		'oddTableRow': 'cssProcessOddTableRow',
		'selectedTableRow': 'cssProcessSelectedTableRow',
		'hoverTableRow': 'cssProcessHoverTableRow',
		'headerCell': 'cssProcessHeaderCell',
		'tableCell': 'cssProcessTableCell',
		'rowNumberCell': 'cssProcessRowNumberCell'
	};

	algrmMonitor.gpuPanelView.prototype.getHtmlDeviceSpecificTitle = function() {
		this.gpuTempGaugeId = this.gpuStrs.gpuTempGaugeId.replace("<id>", this.model.id);
		this.gpuPanelTitleId = this.gpuStrs.gpuPanelTitleId.replace("<id>", this.model.id);
		var htmlDeviceSpecificTitle = this.gpuStrs.htmlDeviceSpecificTitle
			.replace("<gpuTempGaugeId>", this.gpuTempGaugeId)
			.replace("<gpuPanelTitleId>", this.gpuPanelTitleId)
			.replace("<gpuName>",  this.model.getInfo().name)
			.replace("<gpuIdx>", this.model.getInfo().idx);
		return htmlDeviceSpecificTitle;
	};

	algrmMonitor.gpuPanelView.prototype.getHtmlDeviceSpecificDashboard = function() {
		this.gpuXGraphPanelId = this.gpuStrs.gpuXGraphPanelId.replace("<id>", this.model.id);
		this.gpuXGraphSVGId = this.gpuStrs.gpuXGraphSVGId.replace("<id>", this.model.id);
		this.gpuProcessTableId = this.gpuStrs.gpuProcessTableId.replace("<id>", this.model.id);
		var htmlDeviceSpecificDashboard = this.gpuStrs.htmlDeviceSpecificDashboard
			.replace("<gpuXGraphPanelId>", this.gpuXGraphPanelId)
			.replace("<gpuXGraphSVGId>", this.gpuXGraphSVGId)
			.replace("<gpuProcessTableId>", this.gpuProcessTableId);
		return htmlDeviceSpecificDashboard;
	};

	algrmMonitor.gpuPanelView.prototype.cachePanelSpecificStructure = function() {
		// cache DOM elements
		this.$gpuXGraphPanel = $("#" + this.gpuXGraphPanelId);
		this.$gpuProcessTable = $("#" + this.gpuProcessTableId);
		this.svgX = this.buildSVG(d3.select("#" + this.gpuXGraphSVGId), "PCI", [this.strs.lineRxTitle, this.strs.lineTxTitle], 15);
		this.gaugeTemp = null;
		this.oldProcessTableProcs = null;
		this.buildGauge("gaugeTemp", d3.select("#" + this.gpuTempGaugeId), "Temp", this.model.getInfo().temperature, this.model.getInfo().temperatureThreshold);
	};

	algrmMonitor.gpuPanelView.prototype.buildGauge = function(member, gauge, title, val, valThreshold) {
		var panel = this;
		google.charts.load('current', {'packages':['gauge']});
		google.charts.setOnLoadCallback( function() {
			chart = panel.buildGaugeCallback(member, gauge, title, val, valThreshold);
		});
	};

	algrmMonitor.gpuPanelView.prototype.buildGaugeCallback = function(member, gauge, title, val, valThreshold) {
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
	};

	algrmMonitor.gpuPanelView.prototype.updateGaugeTemp = function() {
		if (this.gaugeTemp) {
			var data = google.visualization.arrayToDataTable([
				['Label', 'Value'],
				["Temp", this.model.getDetails().temperature]]);
		
				var options = {
				width: 300, height: 90,
				redFrom: this.model.getDetails().temperatureThreshold, redTo: 120,
				minorTicks: 5
				};

			this.gaugeTemp.draw(data, options);
		}
	};

	algrmMonitor.gpuPanelView.prototype.processTableWasUpdate = function() {
		var oldProcs = this.oldProcessTableProcs;
		var procs = this.model.getDetails().procs;
		procs.sort(function(a, b) { return a.pid - b.pid; });
		this.oldProcessTableProcs = procs;
		if (oldProcs) {
			return isEqual(oldProcs, procs);
		} 
		return true;
	};

	algrmMonitor.gpuPanelView.prototype.buildProcessTable = function() {
		var panel = this;
		var gpuDetails = this.model.getDetails();
		if (this.processTableWasUpdate())
		{
			google.charts.load('current', {'packages':['table']});
			google.charts.setOnLoadCallback(function() {
				chart = panel.buildTableCallback(gpuDetails);
			});	
		}
	};

	algrmMonitor.gpuPanelView.prototype.buildTableCallback = function(gpuDetails) {
		var options = {
			showRowNumber: false,
			width: '80%', 
			cssClassNames: this.cssProcessTableClassNames
		};

		var data = new google.visualization.DataTable(); 
			data.addColumn('number', 'PID');
			data.addColumn('string', 'Process');
			data.addColumn('string', 'User');
			data.addColumn('number', 'Mem Usage [MB]');
			
			for (var i in gpuDetails.procs) {
				var proc = gpuDetails.procs[i];
				var usedGpuMemoryPercent = 100*proc.usedGpuMemory/gpuDetails.memTotal;
				var usedGpuMemory = proc.usedGpuMemory/1024/1024 + ' (' + usedGpuMemoryPercent.toFixed(0) + '%)';
				if (proc.usedGpuMemory < 0) {
					usedGpuMemory = "?";
				}
				data.addRow([proc.pid, proc.cmd, proc.username, {v: proc.usedGpuMemory, f: usedGpuMemory}]);
			}

			var table = new google.visualization.Table( d3.select("#" + this.gpuProcessTableId)[0][0] );

			table.draw(data, options);
	};

	algrmMonitor.gpuPanelView.prototype.updateRxGraph = function() {
		this.updateGraph(this.svgX, this.gpuStrs.lineRxTitle,
			this.model.details.graph_time, this.model.details.graph_rx, -60);
	};
	
	algrmMonitor.gpuPanelView.prototype.updateTxGraph = function() {
		this.updateGraph(this.svgX, this.gpuStrs.lineTxTitle,
			this.model.details.graph_time, this.model.details.graph_tx, -60);
	};

	algrmMonitor.gpuPanelView.prototype.updateDetails = function() {
		algrmMonitor.panelView.prototype.updateDetails.call(this);
		this.buildProcessTable();
		this.updateRxGraph();
		this.updateTxGraph();
		this.updateGaugeTemp();
	};
})();
