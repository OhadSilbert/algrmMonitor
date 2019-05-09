var algrmMonitor = algrmMonitor || {};

(function() {
	/* *******************************************************
	 * This code was inspired from:
	 * https://www.awwwards.com/build-a-simple-javascript-app-the-mvc-way.html
	 */
	 
	/* ================================================================= */
	/* 
	 *                           panelController
	 */
	algrmMonitor.panelController = function (model, view) {
		this.model = model;
		this.view = view;
		
		this.init();
	};

	algrmMonitor.panelController.prototype = {
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
		
		updateInfo: function(info) {
			this.model.updateInfo(info);
		},
		
		updateDetails: function(url) {
			var currentController = this;
			return $.getJSON(url, {"idx" : this.model.getInfo().idx, "lTime" : this.model.getLTime()})
				.then(function(details) {
					currentController.model.updateDetails(details);
					currentController.model.onlineDetails(true);
				})
				.fail(function() {
					currentController.model.onlineDetails(false);
				});
		}
	};

})();
