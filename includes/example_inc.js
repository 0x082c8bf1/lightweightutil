dashboard.registerInclude({
	name: "example_inc",

	//The apply function is called with the module for the element that it's being included in
	// So adding testFunc to
	apply: function(module) {
		_this = this;

		module.includeFunction = function() {
			_this.privateFunction();
		}
	},

	//This is an example of a function that cannot be directly called by the including module.
	privateFunction: function() {
		log("Do something");
	}
});
