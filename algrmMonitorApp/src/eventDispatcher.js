var algrmMonitor = algrmMonitor || {};

(function() {
	/* *******************************************************
	 * This code was inspired from:
	 * https://www.awwwards.com/build-a-simple-javascript-app-the-mvc-way.html
	 */
	 
	/* ================================================================= */	 
	/* 
	 *                           EventDispatcher
	 */
	algrmMonitor.eventDispatcher = function (sender) {
		this._sender = sender;
		this._listeners = [];
	};

	algrmMonitor.eventDispatcher.prototype = {
		attach: function (listener) {
			this._listeners.push(listener);
		},
		notify: function (args) {
			for (var i = 0; i < this._listeners.length; i += 1) {
				this._listeners[i](this._sender, args);
			}
		}
	};
})();
