'use strict';
dashboard.tests.registerTester(
	"example",
	[
		//generic test
		{name: "test", test: function(){
			return (1 == 1);
		}},

		//test a function
		{name: "functions", test: function(inst, module){
			return (module.return4() == 4);
		}},

		//test interaction
		{name: "interaction", test: function(inst){
			dashboard.tests.click(inst.q(".click"));
			dashboard.tests.click(inst.q(".click"));
			return inst.q(".click").value === "2";
		}},

		//test force settings
		{name: "setting", test: function(inst, module){
			//anything after this (including future tests) will have exampleNumber = 2
			dashboard.tests.forceSetting(module.name, "exampleNumber", 2);
			return getSetting(module.name, "exampleNumber") == 2;
		}},
	]
);
