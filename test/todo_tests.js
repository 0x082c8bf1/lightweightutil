'use strict';
dashboard.tests.registerTester(
	"todo",
	[
		//test adding todo
		{name: "add", test: function(inst){
			const count = inst.qAll(".todo_entry").length;
			dashboard.tests.click(inst.q(".insertButton"));
			const newCount = inst.qAll(".todo_entry").length;
			return (count+1 == newCount);
		}},

		//test editing todo (moving values from dialog -> DOM)
		{name: "editSaving", test: function(inst){
			dashboard.tests.click(inst.qAll(".listEntry")[0]);
			//use a random number [1000-9999] so the test can be accurately run multiple times
			//	regardless of save data
			const value = Math.floor(Math.random() * 9000 + 1000);
			inst.q(".dueSetting").value = value+"-01-01";
			inst.qAll(".title")[0].value = value+1;
			inst.q(".descriptionSetting").value = value+2;
			dashboard.tests.click(inst.q(".saveSetting"));

			const todo = inst.qAll(".todo_entry")[0];
			if (todo.querySelector(".title").textContent !== ""+(value + 1))
				return false;
			if (todo.querySelector(".description").textContent !== ""+(value + 2))
				return false;
			if (todo.querySelector(".dueDate").textContent !== value + "-01-01")
				return false;
			return true;
		}},

		//test opening a todo for editing (moving values from DOM -> dialog)
		{name: "editLoading", test: function(inst){
			//reset selection values since
			inst.q(".dueSetting").value = "";
			inst.qAll(".title")[0].value = "";
			inst.q(".descriptionSetting").value = "";

			dashboard.tests.click(inst.qAll(".listEntry")[1]);

			const todo = inst.qAll(".todo_entry")[0];
			let pass = true;
			if (inst.q(".dueSetting").value !== todo.querySelector(".dueDate").textContent)
				pass = false;
			if (inst.qAll(".title")[0].value !== todo.querySelector(".title").textContent)
				pass = false;
			if (inst.q(".descriptionSetting").value !== todo.querySelector(".description").textContent)
				pass = false;
			dashboard.tests.click(inst.q(".backgroundFade"));
			return pass;
		}},

		//test completing a todo
		{name: "complete", test: function(inst){
			const todo = inst.qAll(".todo_entry")[0];

			dashboard.tests.click(todo.querySelector(".checkbox"));

			return todo.hidden;
		}},

		//test removing todo
		{name: "remove", test: function(inst){
			const count = inst.qAll(".todo_entry").length;

			dashboard.tests.click(inst.qAll(".listEntry")[1]);
			dashboard.tests.click(inst.q(".deleteSetting"));

			const newCount = inst.qAll(".todo_entry").length;
			return (count-1 == newCount);
		}},
	]
);
