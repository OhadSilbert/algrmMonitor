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
		
		updateGPUDetails: function(gpuDetails) {
			this.gpuDetails = gpuDetails;
			this.updateGPUDetailsEvent.notify();
		},
		
		onlineGPUDetails: function(onlineStatus) {
			this.onlineStatus = onlineStatus;
			this.updateOnlineStatusEvent.notify();
		},
				
		getGPUInfo: function() {
			return this.gpuInfo;
		},
		
		getGPUDetails: function() {
			return this.gpuDetails;
		}

	 };	 

})();
