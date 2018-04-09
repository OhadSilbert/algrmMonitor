var algrmMonitor = algrmMonitor || {};

(function() {
	var algrmServerURL = "/monitor/GPUs";
	
	$(document).ready(function() { algrmMonitor.buildAlgrmDashboard(); });

	algrmMonitor.constructGPUPanels = function(gpus) {
		var panels = []
		
		// build MVC for each panel
		for (var i in gpus) {
			var gpu = gpus[i];
			var panelModel = new algrmMonitor.gpuPanelModel();
			var panelView = new algrmMonitor.gpuPanelView(panelModel);
			var panelController = new algrmMonitor.gpuPanelController(panelModel, panelView);
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
				panels[i].controller.updateGPUDetails(algrmServerURL);
			}
		}, 1000);

	}

	algrmMonitor.buildAlgrmDashboard = function() {
		$("title").text("Algrm Monitor : " + location.hostname);
		$.getJSON(algrmServerURL)
		.done( function(data) {
			$("#algrmDashboard").empty();
			algrmMonitor.constructGPUPanels(data);
		} )
		.fail( function() {
			console.log("failed to load GPUs: algrm server is not responding");
			$("#algrmDashboard").html("<div class='errorAlgrmLine'>R.I.P.<BR>algrm is dead</div>");
		} );
	}
})();
