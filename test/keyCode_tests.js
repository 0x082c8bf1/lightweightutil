'use strict';
dashboard.tests.registerTester(
	"keyCode",
	[
		//test keyboard event
		{name: "event", test: function(inst){
			inst.q(".focusBox").dispatchEvent(new KeyboardEvent('keydown', {'key': 'a'}));

			return (inst.q(".keycodeOutput").textContent.includes("key == 'a'"));
		}},

		//test resetting
		{name: "reset", test: function(inst){
			inst.q(".focusBox").dispatchEvent(new KeyboardEvent('keydown', {'key': 'a'}));
			dashboard.tests.click(inst.q(".resetKeyCodeOutput"));

			return (inst.q(".keycodeOutput").textContent==="");
		}},
	]
);
