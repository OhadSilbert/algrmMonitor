var algrmMonitor = algrmMonitor || {};

(function() {
	/* *******************************************************
	 * This code was inspired from:
	 * https://www.awwwards.com/build-a-simple-javascript-app-the-mvc-way.html
	 */
	 
	/* ================================================================= */
	/* 
	 *                           cpuPanelController
	 */
	algrmMonitor.cpuPanelController = function (model, view) {
		this.model = model;
		this.view = view;
		
		this.init();
	};

	algrmMonitor.cpuPanelController.prototype = {
		init: function () {
			this.createChildren()
				.setupHandlers()
				.enable();
		},

		createChildren: function () {
			// no need to create children inside the controller
			// this is a job for the view
			// you could all as well leave this function out
			return this;
		},

		setupHandlers: function () {
			return this;
		},

		enable: function () {
			return this;
		},
		
		newPanel: function(id) {
			this.model.newPanel(id);
		},
		
		updateCPUInfo: function(cpuInfo) {
			this.model.updateCPUInfo(cpuInfo);
		},
		
		updateCPUDetails: function(url) {
			var currentController = this;
			return $.getJSON(url, {"gpuIdx" : this.model.getCPUInfo().cpuIdx, "lTime" : this.model.getCPULTime()})
				.then(function(cpuDetails) {
					currentController.model.updateCPUDetails(cpuDetails);
					currentController.model.onlineCPUDetails(true);
				})
				.fail(function() {
					currentController.model.onlineCPUDetails(false);
				});
		}
	};

})();
