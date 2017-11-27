var algrmServerURL = "http://127.0.0.1:4000/monitor/";


function gpuPanel(gpu) {
	this.gpu = gpu;

	this.render = function() {
		var html = '';
		html += '<h1 id="gpuPanelTitle_' + gpu.internalIndex + '" class="gpu-title">';
		html += this.gpu.gpuName + ' (' + gpu.gpuIdx + ')';
		html += '</h1>'
		html += '<div id="gpuUtilGraphPanel_' + gpu.internalIndex + '" class="gpu-graph">';
		html += '</div>'
		html += '<div id="gpuMemGraphPanel_' + gpu.internalIndex + '" class="gpu-graph">';
		html += '</div>'
		html += '<div id="gpuProcessPanel_' + gpu.internalIndex + '" class="gpu-process">';
		html += '</div>'
		document.getElementById("gpuPanel_" + gpu.internalIndex).innerHTML = html;
	}
	
	this.updateGPUInfo = function(gpuInfo) {
		var html = '';
		html += '<table id="gpuProcessTable_' + this.gpu.internalIndex + '" class="gpu-process-table">';
		html += '<tr><th>PID</th><th>Process</th><th>Mem Usage [MB]</th></tr>';
		for (i in gpuInfo.procs) {
			html += '<tr>';
			html += '<td>' + gpuInfo.procs[i].pid + '</td>';
			html += '<td>' + gpuInfo.procs[i].cmd + '</td>';
			html += '<td>' + gpuInfo.procs[i].usedGpuMemory/1024/1024 + '</td>';
			html += '</tr>';
		}
		html += '</table>';
		document.getElementById("gpuProcessPanel_" + this.gpu.internalIndex).innerHTML = html;
	}

	this.refresh = function() {
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
		xhttp.open("GET", algrmServerURL + "GPUs?gpuIdx=" + this.gpu.gpuIdx, true);
		xhttp.send();
	}
}


function constructGPUPanels(gpus) {
	var panels = []
	var html = ''
	for (i in gpus) {
		console.log("gpu " + gpus[i].gpuIdx + ": " + gpus[i].gpuName + "(" + gpus[i].gpuId + ")");
		var gpu = gpus[i];
		gpu.internalIndex = i;
		html += '<div id="gpuPanel_' + gpu.internalIndex + '" class="gpu-panel">';
		html += '</div>'
		var panel = new gpuPanel(gpu);
		panels[i] = panel;
	}
	document.getElementById("algrmDashboard").innerHTML = html;
	
	for (i in panels) {
		panels[i].render();
	}
	
	setInterval(function() {
		for (i in panels) {
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
	xhttp.open("GET", algrmServerURL + "GPUs", true);
	xhttp.send();
}


buildAlgrmDashboard(algrmServerURL);

