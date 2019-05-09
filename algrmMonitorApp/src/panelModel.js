var algrmMonitor = algrmMonitor || {};

(function() {
	/* *******************************************************
	 * This code was inspired from:
	 * https://www.awwwards.com/build-a-simple-javascript-app-the-mvc-way.html
	 */
	 
	/* ================================================================= */	 	
	/* 
	 *                           panelModel
	 */
	algrmMonitor.panelModel = function () {
		this.info = null;
		this.details = null
		this.newPanelEvent = new algrmMonitor.eventDispatcher(this);
		this.updateInfoEvent = new algrmMonitor.eventDispatcher(this);
		this.updateDetailsEvent = new algrmMonitor.eventDispatcher(this);
		this.updateOnlineStatusEvent = new algrmMonitor.eventDispatcher(this);
	};

	algrmMonitor.panelModel.prototype = {
		newPanel: function(id) {
			this.id = id;
			this.newPanelEvent.notify();
		},
		
		updateInfo: function(info) {
			this.info = info;
			this.updateInfoEvent.notify();
		},
		
		refSort: function(targetData, refData) {
			// Create an array of indices [0, 1, 2, ...N].
			var indices = Object.keys(refData);

			// Sort array of indices according to the reference data.
			indices.sort(function(indexA, indexB) {
				if (refData[indexA] < refData[indexB]) {
					return -1;
				} else if (refData[indexA] > refData[indexB]) {
					return 1;
				}
				return 0;
			});

			// Map array of indices to corresponding values of the target array.
			return indices.map(function(index) {
				return targetData[index];
			});
		},
		
		updateDetails: function(details) {
			var lastDetails = this.details;
			this.details = details;
			if (lastDetails != null) {
				this.details.graph_time = lastDetails.graph_time.concat(details.graph_time);
				this.details.graph_util = this.refSort(lastDetails.graph_util.concat(details.graph_util), this.details.graph_time);
				this.details.graph_mem = this.refSort(lastDetails.graph_mem.concat(details.graph_mem), this.details.graph_time);
				this.details.graph_time = this.details.graph_time.sort();
				
				var ltime = this.details.graph_time[this.details.graph_time.length-1];
				for (var idx = 0; idx < this.details.graph_time.length; idx++) {
					if (ltime - this.details.graph_time[idx] <= 60.) {
						break;
					}
				}
				this.details.graph_time = this.details.graph_time.slice(idx);
				this.details.graph_util = this.details.graph_util.slice(idx);
                this.details.graph_mem = this.details.graph_mem.slice(idx);
                this.addToDetails(lastDetails, details);
			}
			this.updateDetailsEvent.notify();
        },
        
        addToDetails: function(lastDetails, newDetails) {
            // Implement when extending this class for details specific attributes
        },
		
		onlineDetails: function(onlineStatus) {
			this.onlineStatus = onlineStatus;
			this.updateOnlineStatusEvent.notify();
		},
				
		getInfo: function() {
			return this.info;
		},
		
		getLTime: function() {
			if (this.details == null) {
				return 0;
			}
			return this.details.graph_time[this.details.graph_time.length - 1];
		},
		
		getDetails: function() {
			return this.details;
		}

	 };	 

})();
