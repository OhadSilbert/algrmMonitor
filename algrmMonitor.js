(function() {
	var algrmServerURL = "/monitor/GPUs";
	
	$(document).ready(function() { buildAlgrmDashboard(); });
	
	/* *******************************************************
	 * This code was inspired from:
	 * https://www.awwwards.com/build-a-simple-javascript-app-the-mvc-way.html
	 */
	 
	/* ================================================================= */	 
	/* 
	 *                           EventDispatcher
	 */
	var Event = function (sender) {
		this._sender = sender;
		this._listeners = [];
	};

	Event.prototype = {
		attach: function (listener) {
			this._listeners.push(listener);
		},
		notify: function (args) {
			for (var i = 0; i < this._listeners.length; i += 1) {
				this._listeners[i](this._sender, args);
			}
		}
	};

	/* ================================================================= */	 	
	/* 
	 *                           gpuPanelModel
	 */
	var gpuPanelModel = function () {
		this.gpuInfo = null;
		this.gpuDetails = null
		this.newPanelEvent = new Event(this);
		this.updateGPUInfoEvent = new Event(this);
		this.updateGPUDetailsEvent = new Event(this);
		this.updateOnlineStatusEvent = new Event(this);
	};

	gpuPanelModel.prototype = {
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

	/* ================================================================= */	 
	/* 
	 *                           gpuPanelView
	 */
	var gpuPanelView = function (model) {
		this.model = model;
		
		// here should be event dispachers for events coming from the view

		this.init();
	};

	gpuPanelView.prototype = {
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
			htmlPanel: '<div id="<gpuPanelId>" class="gpu-panel"></div>',
			htmlPanelStructure: '<h1 id="<gpuPanelTitleId>" class="gpu-title"><gpuName> (<gpuIdx>)</h1> \
								 <div id="<gpuUtilGraphPanelId>"  class="gpu-graph"></div> \
								 <div id="<gpuMemGraphPanelId>"  class="gpu-graph"></div> \
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
		
		buildPanelStructure: function() {
			this.gpuPanelTitleId = this.strs.gpuPanelTitleId.replace("<id>", this.model.id);
			this.gpuUtilGraphPanelId = this.strs.gpuUtilGraphPanelId.replace("<id>", this.model.id);
			this.gpuMemGraphPanelId = this.strs.gpuMemGraphPanelId.replace("<id>", this.model.id);
			this.gpuProcessPanelId = this.strs.gpuProcessPanelId.replace("<id>", this.model.id);
			this.gpuProcessTableId = this.strs.gpuProcessTableId.replace("<id>", this.model.id);
			var html = this.strs.htmlPanelStructure
				.replace("<gpuPanelTitleId>", this.gpuPanelTitleId)
				.replace("<gpuUtilGraphPanelId>", this.gpuUtilGraphPanelId)
				.replace("<gpuMemGraphPanelId>", this.gpuMemGraphPanelId)
				.replace("<gpuProcessPanelId>", this.gpuProcessPanelId)
				.replace("<gpuName>", this.model.getGPUInfo().gpuName)
				.replace('<gpuIdx>', this.model.getGPUInfo().gpuIdx)
				.replace("<gpuProcessTableId>", this.gpuProcessTableId);
			this.$gpuPanel.html(html);
			this.$gpuUtilGraphPanel = $("#" + this.gpuUtilGraphPanelId);
			this.$gpuMemGraphPanel = $("#" + this.gpuMemGraphPanelId);
			this.$gpuProcessPanel = $("#" + this.gpuProcessPanelId);
			this.$gpuProcessTable = $("#" + this.gpuProcessTableId + " tbody");
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

	/* ================================================================= */
	/* 
	 *                           gpuPanelController
	 */
	var gpuPanelController = function (model, view) {
		this.model = model;
		this.view = view;
		
		this.init();
	};

	gpuPanelController.prototype = {
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
		
		updateGPUInfo: function(gpuInfo) {
			this.model.updateGPUInfo(gpuInfo);
		},
		
		updateGPUDetails: function() {
			var currentController = this;
			return $.getJSON(algrmServerURL, {"gpuIdx" : this.model.getGPUInfo().gpuIdx})
				.then(function(gpuDetails) {
					currentController.model.updateGPUDetails(gpuDetails);
					currentController.model.onlineGPUDetails(true);
				})
				.fail(function() {
					currentController.model.onlineGPUDetails(false);
				});
		}
	};

	/* *******************************************************
	   ******************************************************* */

	function constructGPUPanels(gpus) {
		var panels = []
		
		// build MVC for each panel
		for (var i in gpus) {
			var gpu = gpus[i];
			var panelModel = new gpuPanelModel();
			var panelView = new gpuPanelView(panelModel);
			var panelController = new gpuPanelController(panelModel, panelView);
			var panelMVC = {"model": panelModel, "view": panelView, "controller": panelController};
			panels.push(panelMVC);
		}

		// assign id to each panel
		for (var i in panels) {
			panels[i].controller.newPanel(i);
		}
		
		// update each panel with the gpu info
		for (var i in panels) {
			panels[i].controller.updateGPUInfo(gpus[i]);
		}
		
		// update gpu data in panels every seconds
		// notice that updateGPUDetails return a promise if you need to use it. 
		setInterval(function() {
			for (var i in panels) {
				panels[i].controller.updateGPUDetails();
			}
		}, 1000);

	}


	function buildAlgrmDashboard() {
		$.getJSON(algrmServerURL)
		.done( function(data) {
			$("#algrmDashboard").empty();
			constructGPUPanels(data);
		} )
		.fail( function() {
			console.log("failed to load GPUs: algrm server is not responding");
			$("#algrmDashboard").html("<div class='errorAlgrmLine'>R.I.P.<BR>algrm is dead</div>");
		} );
	}
})();
