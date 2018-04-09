var algrmMonitor = algrmMonitor || {};

(function() {
	/* *******************************************************
	 * This code was inspired from:
	 * https://www.awwwards.com/build-a-simple-javascript-app-the-mvc-way.html
	 */
	 
	/* ================================================================= */
	/* 
	 *                           gpuPanelController
	 */
	algrmMonitor.gpuPanelController = function (model, view) {
		this.model = model;
		this.view = view;
		
		this.tensorboards = [];
		this.init();
	};

	algrmMonitor.gpuPanelController.prototype = {
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
			this.clickProcessTableRowHandler = this.clickProcessTableRow.bind(this);
			return this;
		},

		enable: function () {
			this.view.clickProcessTableRowEvent.attach(this.clickProcessTableRowHandler);
			return this;
		},
		
		clickProcessTableRow: function(sender, rowIndex) {
			proc = this.model.getGPUDetails().procs[rowIndex-1];
			if (proc.tensorboard > 0) {
				var tensorboardId = proc.username + proc.tensorboard;
				for (var i=0; i < this.tensorboards.length; i++) {
					if (this.tensorboards[i].id == tensorboardId) {
						break;
					}
				}
				if (i == this.tensorboards.length) {
						this.tensorboards.push({id: tensorboardId});
						this.view.showTensorboard(tensorboardId, proc.tensorboard);
				}
				
			}
		},
		
		newPanel: function(id) {
			this.model.newPanel(id);
		},
		
		updateGPUInfo: function(gpuInfo) {
			this.model.updateGPUInfo(gpuInfo);
		},
		
		updateGPUDetails: function(url) {
			var currentController = this;
			return $.getJSON(url, {"gpuIdx" : this.model.getGPUInfo().gpuIdx, "lTime" : this.model.getGPULTime()})
				.then(function(gpuDetails) {
					currentController.model.updateGPUDetails(gpuDetails);
					currentController.model.onlineGPUDetails(true);
				})
				.fail(function() {
					currentController.model.onlineGPUDetails(false);
				});
		}
	};

})();
