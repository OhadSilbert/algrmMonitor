var algrmMonitor = algrmMonitor || {};

(function() {
	/* ================================================================= */	 	
	/* 
	 *                           gpuPanelModel
	 */
	algrmMonitor.gpuPanelModel = function () {
		algrmMonitor.panelModel.call(this);
	};

	algrmMonitor.gpuPanelModel.prototype = Object.create(algrmMonitor.panelModel.prototype);
    algrmMonitor.gpuPanelModel.prototype.constructor = algrmMonitor.gpuPanelModel;

	algrmMonitor.gpuPanelModel.prototype.addToDetails = function(lastDetails, newDetails) {
		var graph_time = lastDetails.graph_time.concat(newDetails.graph_time);

		this.details.graph_rx = this.refSort(lastDetails.graph_rx.concat(newDetails.graph_rx), graph_time);
		this.details.graph_tx = this.refSort(lastDetails.graph_tx.concat(newDetails.graph_tx), graph_time);

		var ltime = graph_time[graph_time.length-1];
		for (var idx = 0; idx < graph_time.length; idx++) {
			if (ltime - graph_time[idx] <= 60.) {
				break;
			}
		}

		this.details.graph_rx = this.details.graph_rx.slice(idx);
		this.details.graph_tx = this.details.graph_tx.slice(idx);
	};
})();
