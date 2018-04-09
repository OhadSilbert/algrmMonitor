var algrmMonitor = algrmMonitor || {};

(function() {
	/* *******************************************************
	 * This code was inspired from:
	 * https://www.awwwards.com/build-a-simple-javascript-app-the-mvc-way.html
	 */
	 
	/* ================================================================= */	 	
	/* 
	 *                           gpuPanelModel
	 */
	algrmMonitor.gpuPanelModel = function () {
		this.gpuInfo = null;
		this.gpuDetails = null
		this.newPanelEvent = new algrmMonitor.eventDispatcher(this);
		this.updateGPUInfoEvent = new algrmMonitor.eventDispatcher(this);
		this.updateGPUDetailsEvent = new algrmMonitor.eventDispatcher(this);
		this.updateOnlineStatusEvent = new algrmMonitor.eventDispatcher(this);
	};

	algrmMonitor.gpuPanelModel.prototype = {
		newPanel: function(id) {
			this.id = id;
			this.newPanelEvent.notify();
		},
		
		updateGPUInfo: function(gpuInfo) {
			this.gpuInfo = gpuInfo;
			this.updateGPUInfoEvent.notify();
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
		
		updateGPUDetails: function(gpuDetails) {
			var lastGPUDetaild = this.gpuDetails;
			this.gpuDetails = gpuDetails;
			if (lastGPUDetaild != null) {
				this.gpuDetails.graph_time = lastGPUDetaild.graph_time.concat(gpuDetails.graph_time);
				this.gpuDetails.graph_util = this.refSort(lastGPUDetaild.graph_util.concat(gpuDetails.graph_util), this.gpuDetails.graph_time);
				this.gpuDetails.graph_mem = this.refSort(lastGPUDetaild.graph_mem.concat(gpuDetails.graph_mem), this.gpuDetails.graph_time);
				this.gpuDetails.graph_rx = this.refSort(lastGPUDetaild.graph_rx.concat(gpuDetails.graph_rx), this.gpuDetails.graph_time);
				this.gpuDetails.graph_tx = this.refSort(lastGPUDetaild.graph_tx.concat(gpuDetails.graph_tx), this.gpuDetails.graph_time);
				this.gpuDetails.graph_time = this.gpuDetails.graph_time.sort();
				
				var ltime = this.gpuDetails.graph_time[this.gpuDetails.graph_time.length-1]
				for (var idx = 0; idx < this.gpuDetails.graph_time.length; idx++) {
					if (ltime - this.gpuDetails.graph_time[idx] <= 60.) {
						break;
					}
				}
				this.gpuDetails.graph_time = this.gpuDetails.graph_time.slice(idx);
				this.gpuDetails.graph_util = this.gpuDetails.graph_util.slice(idx);
				this.gpuDetails.graph_mem = this.gpuDetails.graph_mem.slice(idx);
				this.gpuDetails.graph_rx = this.gpuDetails.graph_rx.slice(idx);
				this.gpuDetails.graph_tx = this.gpuDetails.graph_tx.slice(idx);
			}
			this.updateGPUDetailsEvent.notify();
		},
		
		onlineGPUDetails: function(onlineStatus) {
			this.onlineStatus = onlineStatus;
			this.updateOnlineStatusEvent.notify();
		},
				
		getGPUInfo: function() {
			return this.gpuInfo;
		},
		
		getGPULTime: function() {
			if (this.gpuDetails == null) {
				return 0;
			}
			return this.gpuDetails.graph_time[this.gpuDetails.graph_time.length - 1];
		},
		
		getGPUDetails: function() {
			return this.gpuDetails;
		}

	 };	 

})();
