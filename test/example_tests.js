'use strict';
dashboard.tests.registerTester(
	"example",
	[

		//generic test
		{name: "test", test: function(module){
			return (1 == 1);
		}},

		//test a function
		{name: "functions", test: function(module, instance){
			return (instance.return4() == 4);
		}},

		//test interaction
		{name: "interaction", test: function(module){
			dashboard.tests.click(module.q(".click"));
			dashboard.tests.click(module.q(".click"));
			return module.q(".click").value == "2";
		}},

		//test force settings
		{name: "setting", test: function(module, instance){
			//anything after this (including future tests) will have exampleNumber = 2
			dashboard.tests.forceSetting(instance.name, "exampleNumber", 2);
			return getSetting(instance.name, "exampleNumber") == 2;
		}},
	]
);
