'use strict';
dashboard.tests.registerTester(
	"dailies",
	[
		// Test adding daily
		{name: "add", test: function(inst){
			const count = inst.qAll(".task_entry").length;
			dashboard.tests.click(inst.q(".insertButton"));
			const newCount = inst.qAll(".task_entry").length;
			return (count+1 == newCount);
		}},

		// Test when dailies are due
		{name: "testDaily", test: function(inst, module, util) {
			const y2023 = new Date("2023-01-01T00:00:00.000");
			const y2024 = new Date("2024-01-01T00:00:00.000");
			const y2025 = new Date("2025-01-01T00:00:00.000");

			const d2023 = util.checkAllDue(module, "daily", "2023-01-01", "", y2023, y2024).length;
			if (d2023 != 365)
				return false;

			const d2024 = util.checkAllDue(module, "daily", "2024-01-01", "", y2024, y2025).length;
			if (d2024 != 366)
				return false;

			return true;
		}},

		// Test when weeklies are due
		{name: "testWeekly", test: function(inst, module, util) {
			const weekStart = new Date("2025-09-01T00:00:00.000");
			const weekEnd = new Date("2025-09-08T00:00:00.000");

			// Check that dayFlag 0 matches Monday
			const due = util.checkAllDue(module, "weekly", "2025-09-01", "0", weekStart, weekEnd);
			if (due[0] !== "2025-09-01: Mon")
				return false;

			// Check that multiple dayFlags match the way that is expected
			const due2 = util.checkAllDue(module, "weekly", "2025-09-01", "0246", weekStart, weekEnd);
			if (due2.length != 4 || due2[3] !== "2025-09-07: Sun")
				return false;

			return true;
		}},

		// Test when monthlies are due
		{name: "testMonthly", test: function(inst, module, util) {
			const y2024 = new Date("2024-01-01T00:00:00.000");
			const y2025 = new Date("2025-01-01T00:00:00.000");

			// Test that this triggers every month
			const due = util.checkAllDue(module, "monthly", "2024-01-01", "", y2024, y2025);
			if (due.length != 12)
				return false;

			// Check end of month with leap day
			const due2 = util.checkAllDue(module, "monthly", "2024-01-31", "", y2024, y2025);
			if (due2.length != 12 || due2[1] !== "2024-02-29: Thu")
				return false;

			return true;
		}},

		// Test when yearlies are due
		{name: "testYearly", test: function(inst, module, util) {
			const y2024 = new Date("2024-01-01T00:00:00.000");
			const y2026 = new Date("2026-01-01T00:00:00.000");

			const due = util.checkAllDue(module, "yearly", "2024-02-29", "", y2024, y2026);
			if (due[0] !== "2024-02-29: Thu" || due[1] !== "2025-02-28: Fri")
				return false;

			return true;
		}},

		// Test removing daily
		{name: "remove", test: function(inst) {
			const count = inst.qAll(".task_entry").length;

			dashboard.tests.click(inst.q(".list").querySelectorAll(".listEntry")[0]);
			dashboard.tests.click(inst.q(".deleteSetting"));

			const newCount = inst.qAll(".task_entry").length;
			return (count - 1 == newCount);
		}},
	],
	// Utility functions
	{
		checkAllDue: function(module, repeatMode, startDate, dayFlags, testFrom, testTo) {
			const dueDates = [];
			testFrom = new Date(testFrom); // Copy so we don't have the variable being passed in
			for(let date=testFrom; date<testTo; date.setUTCDate(date.getUTCDate() + 1)) {
				let output = getFormattedDate(date);
				const due = module.isDue(date, repeatMode, startDate, dayFlags);
				output += ": " + date.toString().slice(0, 3);
				if (due)
					dueDates.push(output);
			}
			return dueDates;
		},
	}
);
