'use strict';
dashboard.tests.registerTester(
	"progressBar",
	[
		//test adding progressBar
		{name: "add", test: function(module){
			let count = module.qAll(".entry").length;
			dashboard.tests.click(module.q(".insertButton"));
			let newCount = module.qAll(".entry").length;
			return (count+1 == newCount);
		}},
		//test removing progressBar
		{name: "remove", test: function(module){
			let count = module.qAll(".entry").length;
			let xes = module.qAll(".deleteButton");
			dashboard.tests.click(xes[xes.length-1]);
			let newCount = module.qAll(".entry").length;
			return (count-1 == newCount);
		}},
	]
);
