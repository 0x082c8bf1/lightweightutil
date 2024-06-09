'use strict';
dashboard.tests.registerTester(
	"todo",
	[
		//test adding todo
		{name: "add", test: function(module){
			let count = module.qAll(".todo_entry").length;
			dashboard.tests.click(module.q(".insertButton"));
			let newCount = module.qAll(".todo_entry").length;
			return (count+1 == newCount);
		}},

		//test editing todo (moving values from dialog -> DOM)
		{name: "editSaving", test: function(module){
			dashboard.tests.click(module.qAll(".listEntry")[0]);
			//use a random number [1000-9999] so the test can be accurately run multiple times
			//	regardless of save data
			let value = Math.floor(Math.random() * 9000 + 1000);
			module.q(".dueSetting").value = value+"-01-01";
			module.qAll(".title")[0].value = value+1;
			module.q(".descriptionSetting").value = value+2;
			dashboard.tests.click(module.q(".saveSetting"));

			let todo = module.qAll(".todo_entry")[0];
			if (todo.querySelector(".title").innerHTML !== ""+(value + 1))
				return false;
			if (todo.querySelector(".description").innerHTML !== ""+(value + 2))
				return false;
			if (todo.querySelector(".dueDate").innerHTML !== value + "-01-01")
				return false;
			return true;
		}},

		//test opening a todo for editing (moving values from DOM -> dialog)
		{name: "editLoading", test: function(module){
			//reset selection values since
			module.q(".dueSetting").value = "";
			module.qAll(".title")[0].value = "";
			module.q(".descriptionSetting").value = "";

			dashboard.tests.click(module.qAll(".listEntry")[1]);

			let todo = module.qAll(".todo_entry")[0];
			let pass = true;
			if (module.q(".dueSetting").value !== todo.querySelector(".dueDate").innerHTML)
				pass = false;
			if (module.qAll(".title")[0].value !== todo.querySelector(".title").innerHTML)
				pass = false;
			if (module.q(".descriptionSetting").value !== todo.querySelector(".description").innerHTML)
				pass = false;
			dashboard.tests.click(module.q(".backgroundFade"));
			return pass;
		}},

		//test completing a todo
		{name: "complete", test: function(module){
			let todo = module.qAll(".todo_entry")[0];

			dashboard.tests.click(todo.querySelector(".checkbox"));

			return todo.hidden;
		}},

		//test removing todo
		{name: "remove", test: function(module){
			let count = module.qAll(".todo_entry").length;

			dashboard.tests.click(module.qAll(".listEntry")[1]);
			dashboard.tests.click(module.q(".deleteSetting"));

			let newCount = module.qAll(".todo_entry").length;
			return (count-1 == newCount);
		}},
	]
);
