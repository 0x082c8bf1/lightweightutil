'use strict';
dashboard.tests.registerTester(
	"progressBar",
	[
		//test adding progressBar
		{name: "add", test: function(inst){
			const count = inst.qAll(".entry").length;
			dashboard.tests.click(inst.q(".insertButton"));
			const newCount = inst.qAll(".entry").length;
			return (count+1 == newCount);
		}},
		//test removing progressBar
		{name: "remove", test: function(inst){
			const count = inst.qAll(".entry").length;
			const xes = inst.qAll(".deleteButton");
			dashboard.tests.click(xes[xes.length-1]);
			const newCount = inst.qAll(".entry").length;
			return (count-1 == newCount);
		}},
	]
);
