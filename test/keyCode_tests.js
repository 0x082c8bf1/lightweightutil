'use strict';
dashboard.tests.registerTester(
	"keyCode",
	[
		//test keyboard event
		{name: "event", test: function(module){
			module.q(".focusBox").dispatchEvent(new KeyboardEvent('keydown', {'key': 'a'}));

			return (module.q(".keycodeOutput").innerHTML.includes("key == 'a'"));
		}},

		//test resetting
		{name: "reset", test: function(module){
			module.q(".focusBox").dispatchEvent(new KeyboardEvent('keydown', {'key': 'a'}));
			dashboard.tests.click(module.q(".resetKeyCodeOutput"));

			return (module.q(".keycodeOutput").innerHTML=="");
		}},
	]
);
