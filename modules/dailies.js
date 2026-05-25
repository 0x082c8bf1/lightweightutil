'use strict';
dashboard.registerModule({
	name: "dailies",
	displayName: "Dailies",
	version: "1.0.0",
	include: ["checkList_inc"],
	saveName: "dl_dailies",

	init: function(inst) {
		this.checklist_init(inst);

		inst.q(".repeatModeSetting").addEventListener("change", function(){
			if (this.value === "weekly") {
				inst.q(".weeklySettings").hidden = false;
			} else {
				inst.q(".weeklySettings").hidden = true;
			}
		});

		// Toggle logic for weekly day selectors
		const daySelectors = inst.qAll(".day");
		for (let i=0; i<daySelectors.length; i++) {
			daySelectors[i].addEventListener("click", function(){
				this.classList.toggle("checked");
			});
		}

		// Apply labels
		const allId = "allFilter" + inst.getId();
		inst.q(".all_filter").id = allId;
		inst.q(".allFilterLabel").setAttribute("for", allId);

		const dueId = "dueFilter" + inst.getId();
		inst.q(".due_filter").id = dueId;
		inst.q(".dueFilterLabel").setAttribute("for", dueId);

		const notDueId = "notDueFilter" + inst.getId();
		inst.q(".notDue_filter").id = notDueId;
		inst.q(".notDueFilterLabel").setAttribute("for", notDueId);

		// Filters
		const _this = this;
		inst.q(".filter").addEventListener("change", function(){
			_this.applyFilters(inst);
		});

		if (getSetting(this.name, "defaultFilterAll")) {
			inst.q(".all_filter").checked = true;
		} else {
			inst.q(".due_filter").checked = true;
		}

		this.applyFilters(inst);
	},

	instantiate: function(where){
		this.checklist_instantiate(where);
	},

	// Called during instantiate() used to create custom elements in the settings
	getCustomSettings: function() {
		return /*html*/`
			<span>Repeat:</span>
			<select class="repeatModeSetting">
				<option value="daily">Daily</option>
				<option value="weekly">Weekly</option>
				<option value="monthly">Monthly</option>
				<option value="yearly">Yearly</option>
			</select>
			<br/><br/>
			<span>Start date:</span>
			<input type="date" class="startDateSetting">
			<div class="weeklySettings">
				<br/>
				<input type="button" class="day day0 checked" value="Mon">
				<input type="button" class="day day1 checked" value="Tue">
				<input type="button" class="day day2 checked" value="Wed">
				<input type="button" class="day day3 checked" value="Thu">
				<input type="button" class="day day4 checked" value="Fri">
				<input type="button" class="day day5 checked" value="Sat">
				<input type="button" class="day day6 checked" value="Sun">
			</div>
		`;
	},

	// Called during instantiate() used to create custom elements on each task
	getCustomValues: function() {
		return /*html*/`
			<input type="hidden" class="repeatMode">
			<input type="hidden" class="startDate">
			<input type="hidden" class="dayFlags">
			<input type="hidden" class="checkedAt">
		`;
	},

	getCustomFilters: function() {
		return /*html*/`
			<span class="filter">
				<input type="radio" name="filter" class="all_filter" \><label class="allFilterLabel">All</label>
				<input type="radio" name="filter" class="due_filter" \><label class="dueFilterLabel">Due</label>
				<input type="radio" name="filter" class="notDue_filter" \><label class="notDueFilterLabel">Not due</label>
			</span>
		`;
	},

	insertHook: function(inst) {
		inst.q(".all_filter").checked = true;
		this.updateAlerts(inst);
	},

	applyFilters: function(inst, changed){
		let hideDue = false;
		let hideNotDue = false;
		if (inst.q(".due_filter").checked) {
			hideNotDue = true;
		} else if (inst.q(".notDue_filter").checked) {
			hideDue = true;
		}

		const entries = inst.qAll(".list > .task_entry");
		for(let entry of entries) {
			if (entry.classList.contains("notDue") || !entry.querySelector(".checkbox:not(:checked)")) {
				entry.hidden = hideNotDue;
			} else {
				entry.hidden = hideDue;
			}

			// This seems weird but is intentional:
			// When the user changes the due date of a daily, we don't want to then hide it,
			// even if their filters say we should so that the user can see their change.
			// This also handles updating the due/notDue classes for the alerts to function.
			this.updateDue(inst, entry);
		}

		if (changed) {
			changed = changed.closest(".task_entry");
			const unchecked = changed.querySelector(".checkbox:not(:checked)");
			const dateElement = changed.querySelector(".checkedAt");
			if (!unchecked) {
				// Set the datetime that it was completed
				dateElement.value = Date.now();
			} else {
				dateElement.value = 0;
			}
		}
	},

	// Called during editTask(), used to set the value of custom settings elements
	editHook: function(inst, daily) {
		inst.q(".repeatModeSetting").value = daily.querySelector(".repeatMode").value;

		inst.q(".startDateSetting").value = daily.querySelector(".startDate").value;

		// Copy dayFlags to settings
		const dayFlags = daily.querySelector(".dayFlags").value;
		const days = inst.qAll(".day");
		for(let i=0; i<days.length; i++) {
			if (dayFlags.indexOf(i) >= 0) {
				days[i].classList.add("checked");
			} else {
				days[i].classList.remove("checked");
			}
		}

		inst.q(".weeklySettings").hidden = (inst.q(".repeatModeSetting").value !== "weekly");
	},

	// Called during saveSettings(), used to save the settings
	saveSettingsHook: function(inst, editing) {
		//save repeat mode
		const repeatModeElement = editing.querySelector(".repeatMode");
		repeatModeElement.value = inst.q(".repeatModeSetting").value;

		//save start date
		editing.querySelector(".startDate").value = inst.q(".startDateSetting").value;

		//conditonally save weekly days if applicable
		if (repeatModeElement.value === "weekly") {
			const days = inst.qAll(".day");
			let dayFlags = "";
			for(let i=0; i<days.length; i++) {
				if (days[i].classList.contains("checked")) {
					dayFlags += i;
				}
			}
			editing.querySelector(".dayFlags").value = dayFlags;
		} else {
			editing.querySelector(".dayFlags").value = "";
		}
	},

	// Returns an object to be added to the save data
	saveTasksHook: function(entry) {
		// Save repeat fields
		const repeatMode = entry.querySelector(".repeatMode").value;
		const startDate = entry.querySelector(".startDate").value;
		const dayFlags = entry.querySelector(".dayFlags").value;
		const checkedAt = entry.querySelector(".checkedAt").value;
		const output = {repeatMode: repeatMode, startDate: startDate, checkedAt: checkedAt};
		if (repeatMode === "weekly") {
			output.dayFlags = dayFlags;
		}
		return output;
	},

	// Called during newTask(), used to set values of custom elements when creating a task
	newHook: function(inst, customData, element) {
		const repeatMode = customData?.repeatMode;
		const startDate = customData?.startDate;
		const dayFlags = customData?.dayFlags;

		if (repeatMode) {
			element.querySelector(".repeatMode").value = repeatMode;
		} else {
			element.querySelector(".repeatMode").value = "weekly";
		}

		if (startDate) {
			element.querySelector(".startDate").value = startDate;
		} else {
			element.querySelector(".startDate").value = getFormattedDate(new Date());
		}

		if (dayFlags != undefined) {
			element.querySelector(".dayFlags").value = dayFlags;
		} else {
			element.querySelector(".dayFlags").value = "0123456";
		}
		element.querySelector(".checkedAt").value = customData?.checkedAt;

		this.updateDue(inst, element);
	},

	updateAlerts: function(inst) {
		let count = 0;
		const entries = inst.qAll(".list > .task_entry");
		for(let entry of entries) {
			if (!entry.classList.contains("notDue") && entry.querySelector(".checkbox:not(:checked)")) {
				count++;
			}
		}

		dashboard.alerts.update(inst, count);
	},

	uncheckAll: function(entry) {
		for (let task of entry) {
			// Uncheck this task
			if (task.hasOwnProperty('checked')) {
				task.checked = false;
			}

			// Do the same for the children of the task
			if (!task.children)
				continue;

			this.uncheckAll(task.children);
		}
	},

	// Returns customData from localStorage object
	loadHook: function(entry) {
		// This is not totally correct, we're consuming the check if it was due on the date that it was checked.
		// If it wasn't due on that day, change it to today (just in case it's due today). This could lead to a check not
		// being consumed if the user didn't login on a day that the task was due. A correct solution here would be to
		// check every day between checkedAt and now and if it was due on any of them, consume the check as well.
		const checkedAtDate = new Date(+entry.checkedAt);
		const checkedAtDateString = getFormattedDate(checkedAtDate);
		const todayDateString = getFormattedDate(new Date());
		const wasDueOnCheckedAt = this.isDue(checkedAtDate, entry.repeatMode, entry.startDate, entry.dayFlags);
		if (checkedAtDateString !== todayDateString && wasDueOnCheckedAt) {
			entry.checkedAt = 0;
			this.uncheckAll(entry.tasks);
		} else {
			entry.checkedAt = Date.now();
		}

		return {repeatMode: entry.repeatMode, startDate: entry.startDate, dayFlags: entry.dayFlags, checkedAt: entry.checkedAt};
	},

	getStyle: function() {
		return this.checklist_getStyle(/*css*/`
			.dailies .checked {
				background-color: black;
			}

			.dailies .notDue .title {
				color: grey;
			}
		`);
	},

	updateDue: function(inst, daily) {
		const today = new Date();
		const repeatMode = daily.querySelector(".repeatMode").value;
		const startDate = daily.querySelector(".startDate").value;
		const dayFlags = daily.querySelector(".dayFlags").value;
		const due = this.isDue(today, repeatMode, startDate, dayFlags);
		if(due) {
			daily.classList.remove("notDue");
		} else {
			daily.classList.add("notDue");
		}
	},

	isDue: function(today, repeatMode, startDateISO, dayFlags) {
		const startDate = new Date(startDateISO);

		// Filter on start date
		if (startDate && startDate > today)
			return false;

		// Filter out false cases
		switch(repeatMode) {
			case "daily":
				// No filtering needed
				break;
			case "weekly":
				// Shift to 0 being Monday
				const dayOfTheWeek = (today.getDay() + 6) % 7;

				// Check if it's not due based on dayFlags
				if (dayFlags.indexOf(dayOfTheWeek) < 0) {
					return false;
				}
				break;
			case "monthly":
				// Match if the day matches or if it's the last day of the month and the startDate day isn't going to happen this month
				if (today.getUTCDate() != startDate.getUTCDate()) {
					const daysInThisMonth = new Date(today.getUTCFullYear(), today.getUTCMonth()+1, 0).getUTCDate();
					if (today.getUTCDate() != daysInThisMonth || startDate.getUTCDate() < today.getUTCDate()) {
						return false;
					}
				}
				break;
			case "yearly":
				// Match if the day matches or if it's the last day of the month and the startDate day isn't going to happen this year (leap day)

				// If the months don't match, it won't match
				if (today.getUTCMonth() != startDate.getUTCMonth())
					return false;

				// If the days don't match, check if that the date is actually happening this year (leap days)
				if (today.getUTCDate() != startDate.getUTCDate()) {
					const daysInThisMonth = new Date(today.getUTCFullYear(), today.getUTCMonth()+1, 0).getUTCDate();
					if (today.getUTCDate() != daysInThisMonth || startDate.getUTCDate() < today.getUTCDate()) {
						return false;
					}
				}
				break;
		}

		return true;
	},

	registerSettings: function(){
		return [
			{
				"name": "defaultName",
				"description": "Default name when a daily is created",
				"type": "text",
				"default": "New daily",
			},
			{
				"name": "defaultFilterAll",
				"description": "Use 'all' as the default filter",
				"type": "bool",
				"default": false,
			}
		]
	},

	registerDocumentation: function() {
		return [
			"Add a daily by clicking on the add button, dailies are recurring tasks.",
			"To edit a daily, click on it's background and this wil take you to the settings for that daily.",
			"On the settings page you can edit the due date and tasks on the daily.",
			"To add a new task, you can click on the add button, this will add a new task under the selected one.",
			"If you want to delete a task, you can click the x next to it, this will also delete all of it's children.",
			"If you want to delete a daily, you can either click on the delete button or you can delete the top task.",
			"If you decide that you do not want to edit a task at any time you can click cancel, escape, or click on the faded background.",
			"To save a task, you can either hit the save button or hit enter.",
			"Once you have your daily, you can mark them as completed from the dashboard.",
			"When 'all' is checked, all dailies will be shown, when 'not due' is checked the completed and not due dailies will be shown, when 'due' only the uncompleted due dailies will be shown",
			"A completed task must have all of it's tasks checked.",
			"You can drag tasks around either when viewing them or in edit mode, in edit mode you can make a task the child of another by dragging it to the right side of another task.",
			"There are four options for how often dailies repeat; daily, weekly, monthly, or yearly",
			"Daily tasks recur every day, weekly tasks repeat on specific days of the week, monthly tasks recur on the day of the month that they were started, yearly tasks recur on the same month and day that they were started.",
			"For monthly and yearly tasks, if the day of the month won't happen this month/year it will recur on first real day before the planned date.",
			"Checking a daily when it's not due will save the fact that it was checked until you log in on a day that it's due.",
		]
	},
});
