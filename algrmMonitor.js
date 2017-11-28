(function() {
	var algrmServerURL = "/monitor";


	function gpuPanel(gpu) {
		this.gpu = gpu;
	}
	
	gpuPanel.prototype.render = function() {
		var html = '<h1 id="gpuPanelTitle_<id>" class="gpu-title"><gpuName> (<gpuIdx>)</h1> \
		<div id="gpuUtilGraphPanel_<id>"  class="gpu-graph"></div> \
		<div id="gpuMemGraphPanel_<id>"  class="gpu-graph"></div> \
		<div id="gpuProcessPanel_<id>"  class="gpu-process"></div>'
		.replace(/<id>/g, this.gpu.internalIndex)
		.replace('<gpuName>', this.gpu.gpuName)
		.replace('<gpuIdx>', this.gpu.gpuIdx);
		document.getElementById("gpuPanel_<id>".replace(/<id>/g, this.gpu.internalIndex)).innerHTML = html;
	}
		
	gpuPanel.prototype.updateGPUInfo = function(gpuInfo) {
		var html = '<table id="gpuProcessTable_<id>" class="gpu-process-table">\
		<tr><th>PID</th><th>Process</th><th>User</th><th>Mem Usage [MB]</th></tr><tablebody></table>'
		.replace(/<id>/g, this.gpu.internalIndex);
		var tablebody = '';
		for (var i in gpuInfo.procs) {
			var usedGpuMemoryPercent = 100*gpuInfo.procs[i].usedGpuMemory/gpuInfo.memTotal;
			var usedGpuMemory = gpuInfo.procs[i].usedGpuMemory/1024/1024 + ' (' + usedGpuMemoryPercent + '%)';
			if (gpuInfo.procs[i].usedGpuMemory<0) {
				usedGpuMemory = "?";
			}
			tablebody += '<tr><td><pid></td><td><cmd></td><td><username></td><td><mem></td></tr>'
			.replace('<pid>', gpuInfo.procs[i].pid)
			.replace('<cmd>', gpuInfo.procs[i].cmd)
			.replace('<username>', gpuInfo.procs[i].username)
			.replace('<mem>', usedGpuMemory);
		}
		html = html.replace('<tablebody>', tablebody);
		document.getElementById("gpuProcessPanel_<id>".replace(/<id>/g, this.gpu.internalIndex)).innerHTML = html;
	}

	gpuPanel.prototype.refresh = function() {
		var xhttp = new XMLHttpRequest();
		xhttp.panel = this;
		xhttp.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				// if panel was freezed, unfreeze.
				var gpuInfo = JSON.parse(this.responseText);
				this.panel.updateGPUInfo(gpuInfo);
			} else if ((this.readyState == 4 && this.status == 0) || this.status >= 400) {
				console.log("failed to get GPU info: algrm server is not responding");
				// Should indicate panel is freeze
			}
		} ;
		var url = "<url>/GPUs?gpuIdx=<gpuIdx>"
		.replace("<url>", algrmServerURL)
		.replace("<gpuIdx>", this.gpu.gpuIdx);
		xhttp.open("GET", url, true);
		xhttp.send();
	}


	function constructGPUPanels(gpus) {
		var panels = []
		var html = ''
		for (var i in gpus) {
			var gpu = gpus[i];
			gpu.internalIndex = i;
			html += '<div id="gpuPanel_<id>" class="gpu-panel"></div>'
			.replace(/<id>/g, gpu.internalIndex);
			var panel = new gpuPanel(gpu);
			panels[i] = panel;
		}
		document.getElementById("algrmDashboard").innerHTML = html;
		
		for (var i in panels) {
			panels[i].render();
		}
		
		setInterval(function() {
			for (var i in panels) {
				panels[i].refresh();
			}
		}, 1000);
	}



	function buildAlgrmDashboard(algrmServerURL) {
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				var gpus = JSON.parse(this.responseText);
				constructGPUPanels(gpus);
			} else if ((this.readyState == 4 && this.status == 0) ||this.status >= 400) {
				console.log("failed to load GPUs: algrm server is not responding");
				document.getElementById("algrmDashboard").innerHTML = 
					"<div class='errorAlgrmLine'>R.I.P.<BR>algrm is dead</div>";
			}
		} ;
		var url = "<url>/GPUs".replace("<url>", algrmServerURL);
		xhttp.open("GET", url, true);
		xhttp.send();
	}


	buildAlgrmDashboard(algrmServerURL);
})();
