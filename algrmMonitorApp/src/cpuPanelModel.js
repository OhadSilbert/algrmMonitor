var algrmMonitor = algrmMonitor || {};

(function() {
	/* *******************************************************
	 * This code was inspired from:
	 * https://www.awwwards.com/build-a-simple-javascript-app-the-mvc-way.html
	 */
	 
	/* ================================================================= */	 	
	/* 
	 *                           cpuPanelModel
	 */
	algrmMonitor.cpuPanelModel = function () {
		this.cpuInfo = null;
		this.cpuDetails = null
		this.newPanelEvent = new algrmMonitor.eventDispatcher(this);
		this.updateCPUInfoEvent = new algrmMonitor.eventDispatcher(this);
		this.updateCPUDetailsEvent = new algrmMonitor.eventDispatcher(this);
		this.updateOnlineStatusEvent = new algrmMonitor.eventDispatcher(this);
	};

	algrmMonitor.cpuPanelModel.prototype = {
		newPanel: function(id) {
			this.id = id;
			this.newPanelEvent.notify();
		},
		
		updateCPUInfo: function(cpuInfo) {
			this.cpuInfo = cpuInfo;
			this.updateCPUInfoEvent.notify();
		},
		
		refSort: function(targetData, refData) {
			// Create an array of indices [0, 1, 2, ...N].
			var indices = Object.keys(refData);

			// Sort array of indices according to the reference data.
			indices.sort(function(indexA, indexB) {
				if (refData[indexA] < refData[indexB]) {
					return -1;
				} else if (refData[indexA] > refData[indexB]) {
					return 1;
				}
				return 0;
			});

			// Map array of indices to corresponding values of the target array.
			return indices.map(function(index) {
				return targetData[index];
			});
		},
		
		updateCPUDetails: function(cpuDetails) {
			var lastCPUDetaild = this.cpuDetails;
			this.cpuDetails = cpuDetails;
			if (lastCPUDetaild != null) {
				this.cpuDetails.graph_time = lastCPUDetaild.graph_time.concat(cpuDetails.graph_time);
				this.cpuDetails.graph_util = this.refSort(lastCPUDetaild.graph_util.concat(cpuDetails.graph_util), this.cpuDetails.graph_time);
				this.cpuDetails.graph_mem = this.refSort(lastCPUDetaild.graph_mem.concat(cpuDetails.graph_mem), this.cpuDetails.graph_time);
				this.cpuDetails.graph_time = this.cpuDetails.graph_time.sort();
				
				var ltime = this.cpuDetails.graph_time[this.cpuDetails.graph_time.length-1]
				for (var idx = 0; idx < this.cpuDetails.graph_time.length; idx++) {
					if (ltime - this.cpuDetails.graph_time[idx] <= 60.) {
						break;
					}
				}
				this.cpuDetails.graph_time = this.cpuDetails.graph_time.slice(idx);
				this.cpuDetails.graph_util = this.cpuDetails.graph_util.slice(idx);
				this.cpuDetails.graph_mem = this.cpuDetails.graph_mem.slice(idx);
			}
			this.updateCPUDetailsEvent.notify();
		},
		
		onlineCPUDetails: function(onlineStatus) {
			this.onlineStatus = onlineStatus;
			this.updateOnlineStatusEvent.notify();
		},
				
		getCPUInfo: function() {
			return this.cpuInfo;
		},
		
		getCPULTime: function() {
			if (this.cpuDetails == null) {
				return 0;
			}
			return this.cpuDetails.graph_time[this.cpuDetails.graph_time.length - 1];
		},
		
		getCPUDetails: function() {
			return this.cpuDetails;
		}

	 };	 

})();
