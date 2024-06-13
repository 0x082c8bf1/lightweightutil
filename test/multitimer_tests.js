'use strict';
dashboard.tests.registerTester(
	"multitimer",
	[
		//test adding timer
		{name: "add", test: function(inst){
			let count = inst.qAll(".timer").length;
			dashboard.tests.click(inst.q(".insertButton"));
			let newCount = inst.qAll(".timer").length;
			return (count+1 == newCount);
		}},

		//test starting timer
		{name: "start", test: function(inst){
			let timer = document.querySelector(".timer");
			dashboard.tests.click(timer.querySelector(".start-button"));
			return (timer.status == inst.status.ACTIVE);
		}},

		//test pausing timer
		{name: "pause", test: function(inst){
			let timer = document.querySelector(".timer");
			dashboard.tests.click(timer.querySelector(".start-button"));
			return (timer.status == inst.status.PAUSED);
		}},

		//test resetting timer
		{name: "reset", test: function(inst){
			let timer = document.querySelector(".timer");
			dashboard.tests.click(timer.querySelector(".x-button"));
			return (timer.status == inst.status.INACTIVE);
		}},

		//test deleting timer
		{name: "delete", test: function(inst){
			let count = inst.qAll(".timer").length;
			dashboard.tests.click(inst.qAll(".x-button")[0]);
			let newCount = inst.qAll(".timer").length;
			return (count-1 == newCount);
		}},

		//test time input to ms
		{name: "timeConversion", test: function(inst, module){
			//some of these tests are specific numbers to avoid floating point inprecision, if any of these
			//	tests fail for those reasons, there should probably be an error threshold to account for it

			// hh,mm,ss conversion
			let time = module.valuesToDuration("1","2","3");
			if (time != 3723000)
				return false;

			//day conversion
			time = module.valuesToDuration("1d2","3","4");
			if (time != 93784000)
				return false;

			//decimal parsing
			time = module.valuesToDuration("1.1d2.2","3.3","4.4");
			if (time != 103162400)
				return false;

			time = module.valuesToDuration("1d2.2","3.3","4.4");
			if (time != 94522400)
				return false;

			time = module.valuesToDuration("1.1d2.2","0","0");
			if (time != 102960000)
				return false;

			time = module.valuesToDuration("1d","2","3");
			if (time != 86523000)
				return false;

			//ignore non-d letters in input
			time = module.valuesToDuration("q","1","1");
			if (time != 61000)
				return false;

			time = module.valuesToDuration("qd1","","");
			if (time != 3600000)
				return false;

			return true;
		}}
	]
);
