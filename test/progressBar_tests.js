'use strict';
dashboard.tests.registerTester(
	"progressBar",
	[
		//test adding progressBar
		{name: "add", test: function(inst){
			let count = inst.qAll(".entry").length;
			dashboard.tests.click(inst.q(".insertButton"));
			let newCount = inst.qAll(".entry").length;
			return (count+1 == newCount);
		}},
		//test removing progressBar
		{name: "remove", test: function(inst){
			let count = inst.qAll(".entry").length;
			let xes = inst.qAll(".deleteButton");
			dashboard.tests.click(xes[xes.length-1]);
			let newCount = inst.qAll(".entry").length;
			return (count-1 == newCount);
		}},
	]
);
