function constructGPUPanels(gpus) {
	for (i in gpus) {
		console.log("gpu " + gpus[i].gpu_i + ": " + gpus[i].gpu_name + "(" + gpus[i].gpu_id + ")")
	}
};


function getGPUsResponse() {
	if (this.readyState == 4 && this.status == 200) {
		gpus = JSON.parse(this.responseText)
		constructGPUPanels(gpus);
    } else if ((this.readyState == 4 && this.status == 0) ||this.status >= 400){
		console.log("failed to load GPUs: algrm server is not responding")
		document.getElementById("algrmDashboard").innerHTML = 
		"<div class='errorAlgrmLine'>R.I.P.<BR>algrm is dead</div>";
	}
}


function buildAlgrmDashboard(algrmServerURL) {
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = getGPUsResponse;
	xhttp.open("GET", algrmServerURL + "GPUs", true);
	xhttp.send();
}


buildAlgrmDashboard("http://127.0.0.1:4000/monitor/")



