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
		//test percentages
		{name: "percents", test: function(inst, module){
			const entries = inst.qAll(".entry");
			const lastEntry = entries[entries.length-1];

			if (lastEntry.querySelector(".completionPercent").innerHTML !== "0.00%")
				return false;

			lastEntry.querySelector(".completedNumber").value = 1;
			lastEntry.querySelector(".totalNumber").value = 2;
			module.processAllBars(inst);

			if (lastEntry.querySelector(".completionPercent").innerHTML !== "50.00%")
				return false;

			return true;
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
