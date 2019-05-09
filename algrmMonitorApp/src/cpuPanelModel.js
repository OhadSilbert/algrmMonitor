var algrmMonitor = algrmMonitor || {};

(function() {
	/* ================================================================= */	 	
	/* 
	 *                           cpuPanelModel
	 */
	algrmMonitor.cpuPanelModel = function () {
		algrmMonitor.panelModel.call(this);
	};

	algrmMonitor.cpuPanelModel.prototype = Object.create(algrmMonitor.panelModel.prototype);
    algrmMonitor.cpuPanelModel.prototype.constructor = algrmMonitor.cpuPanelModel;

	algrmMonitor.gpuPanelModel.prototype.addToDetails = function(lastDetails, newDetails) {
		// nothing to add for now
	};

})();
