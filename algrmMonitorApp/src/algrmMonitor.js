var algrmMonitor = algrmMonitor || {};

(function() {
	var algrmServerURL = "/monitor/Devices";
	
	$(document).ready(function() { algrmMonitor.buildAlgrmDashboard(); });

	algrmMonitor.constructDevicePanels = function(devices) {
		var panels = []
		var cpuPanel = null;
		
		// build MVC for each panel
		var gpus = []
		var cpu = null;
		for (var i in devices) {
			var device = devices[i];
			if ( device.idx >= 0 ) {
				gpus.push(device);
				var panelModel = new algrmMonitor.gpuPanelModel();
				var panelView = new algrmMonitor.gpuPanelView(panelModel);
				var panelController = new algrmMonitor.panelController(panelModel, panelView);
				var panelMVC = {"model": panelModel, "view": panelView, "controller": panelController};
			    panels.push(panelMVC);
			} else {
				cpu = device;
				var panelModel = new algrmMonitor.cpuPanelModel();
				var panelView = new algrmMonitor.cpuPanelView(panelModel);
				var panelController = new algrmMonitor.panelController(panelModel, panelView);
				var panelMVC = {"model": panelModel, "view": panelView, "controller": panelController};
			    cpuPanel = panelMVC;
			}
		}

		// assign id to each panel
		cpuPanel.controller.newPanel(-1)
		for (var i in panels) {
			panels[i].controller.newPanel(i);
		}
		
		// update each panel with the device info
		cpuPanel.controller.updateInfo(cpu);
		for (var i in panels) {
			panels[i].controller.updateInfo(gpus[i]);
		}
		
		// update device data in panels every seconds
		// notice that updateDetails return a promise if you need to use it. 
		setInterval(function() {
			cpuPanel.controller.updateDetails(algrmServerURL);
			for (var i in panels) {
				panels[i].controller.updateDetails(algrmServerURL);
			}
		}, 1000);

	}

	algrmMonitor.buildAlgrmDashboard = function() {
		$("title").text("Algrm Monitor : " + location.hostname);
		$.getJSON(algrmServerURL)
		.done( function(data) {
			$("#algrmDashboard").empty();
			algrmMonitor.constructDevicePanels(data);
		} )
		.fail( function() {
			console.log("failed to load GPUs: algrm server is not responding");
			$("#algrmDashboard").html("<div class='errorAlgrmLine'>R.I.P.<BR>algrm is dead</div>");
		} );
	}
})();
