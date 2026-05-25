'use strict';
dashboard.registerModule({
	name: "todo",
	displayName: "Todo List",
	version: "1.0.1",
	include: ["checkList_inc"],
	saveName: "td_todos",

	init: function(inst) {
		this.checklist_init(inst);

		// Due now button
		inst.q(".dueNow").addEventListener("click", function(){
			const today = new Date();
			const now = getFormattedDate(today);

			inst.q(".dueSetting").value = now;
		});

		inst.q(".clearDate").addEventListener("click", function(){
			inst.q(".dueSetting").value = "";
		});

		// Apply labels
		const completedId = "completed" + inst.getId();
		inst.q(".completed").id = completedId;
		inst.q(".completedLabel").setAttribute("for", completedId);

		// Completed button
		const _this = this;
		inst.q(".completed").addEventListener("change", function(){
			_this.applyFilters(inst);
		});

		this.applyFilters(inst);
	},

	instantiate: function(where){
		this.checklist_instantiate(where);
	},

	getStyle: function(){
		return this.checklist_getStyle(/*css*/`
			.todo .date,
			.todo .completedDisplay {
				color: #787878;
			}

			.checklist .due {
				color: var(--lw-important);
			}

			.checklist .completed {
				margin-right: 0px;
			}
		`);
	},

	// Called during instantiate() used to create custom elements in the settings
	getCustomSettings: function() {
		return /*html*/`
			<input type="date" class="dueSetting"/>
			<input type="button" class="dueNow" value="Today"/>
			<input type="button" class="clearDate" value="Clear"/>
		`;
	},

	// Called during instantiate() used to create custom elements on each task
	getCustomValues: function() {
		return /*html*/`
			<div class="date">
				<span class="dueDate colorOverride"></span><span class="relativeDate colorOverride"></span>
			</div>
			<span class="completedDisplay colorOverride"></span>
			<input type="hidden" class="completedDate" value="0"/>
		`;
	},

	getCustomFilters: function() {
		return /*html*/`
			<input type="checkbox" class="completed" \><label class="completedLabel">Complete</label>
		`;
	},

	// Hides todos where none of the tasks are unchecked
	applyFilters: function(inst, changed){
		const hide = !inst.q(".completed").checked;

		const todos = inst.qAll(".list > .task_entry");
		for(let todo of todos) {
			todo.hidden = (hide == (todo.querySelector(".checkbox:not(:checked)") == null));
		}

		if (changed) {
			changed = changed.closest(".task_entry");
			const unchecked = changed.querySelector(".checkbox:not(:checked)");
			const dateElement = changed.querySelector(".completedDate");
			if (!unchecked) {
				// Set the datetime that it was completed
				dateElement.value = Date.now();
				changed.querySelector(".completedDisplay").textContent = "Completed: " + getFormattedDate(new Date(+dateElement.value));
			} else {
				dateElement.value = 0;
				changed.querySelector(".completedDisplay").textContent = "";
			}
		}
	},

	// Called during editTask(), used to set the value of custom settings elements
	editHook: function(inst, todo) {
		inst.q(".dueSetting").value = todo.querySelector(".dueDate").textContent;
	},

	// Called during saveSettings(), used to save custom settings
	saveSettingsHook: function(inst, editing) {
		// Save date
		const selectedDate = inst.q(".dueSetting").value;
		editing.querySelector(".dueDate").textContent = selectedDate;

		this.setDateDisplay(editing.querySelector(".relativeDate"), selectedDate, editing.querySelector(".date"));
	},

	// Returns an object to be added to the save data
	saveTasksHook: function(entry) {
		const date = entry.querySelector(".dueDate").textContent;
		const completionDate = entry.querySelector(".completedDate").value;
		return {date: date, completed: completionDate};
	},

	// Called during newTask(), used to set values when creating a todo on custom elements
	newHook: function(inst, customData, element) {
		const date = customData?.date;
		// Set the default date
		let todoDate;
		if (date) {
			todoDate = date;
		} else {
			todoDate = "";
		}

		if (todoDate != ""){
			element.querySelector(".dueDate").textContent = getFormattedDate(todoDate, true);
			this.setDateDisplay(element.querySelector(".relativeDate"), new Date(getFormattedDate(todoDate, true)), element.querySelector(".date"));
		}

		// Set the completion date
		let completionDate = customData?.completionDate;
		if (!completionDate) {
			completionDate = 0;
		} else if (completionDate !== "0") {
			element.querySelector(".completedDisplay").textContent = "Completed: " + getFormattedDate(new Date(+completionDate));
		}
		element.querySelector(".completedDate").value = completionDate;
	},

	updateAlerts: function(inst) {
		const entries = inst.qAll(".task_entry");
		let count = 0;
		for(let e of entries) {
			const completedDate = e.querySelector(".completedDate").value;
			if (e.querySelector(".due") && completedDate <= 0) {
				count++;
			}
		}
		dashboard.alerts.update(inst, count);
	},

	insertHook: function(inst) {
		inst.q(".completed").checked = false;
	},

	// Set the relative days amount and add sets "due" class on colorElement
	setDateDisplay: function(element, date, colorElement) {
		let text = "";
		let days = 0;
		if (date !== "") {
			days = this.getRelativeDate(new Date(date));
			const dayString = days == 1 ? "day" : "days";
			text = ", " + days + " " + dayString;
		}

		element.textContent = text;

		if (days <= 0 && text !== "") { // If there's no text, remove class, this diambiguates due today and no date
			colorElement.classList.add("due");
		} else {
			colorElement.classList.remove("due");
		}
	},

	getRelativeDate: function(date){
		const msPerDay = 1000*60*60*24;
		const currentDay = new Date(getFormattedDate(new Date()));
		const days = (date/msPerDay - Math.floor(currentDay/msPerDay));
		return days;
	},

	// Returns customData from localStorage object
	loadHook: function(entry) {
		// Don't load any todos that need to be purged
		const purgeDays = getSetting(this.name, "purgeCompleted");
		const dontLoadBefore = Date.now() - purgeDays*1000*60*60*24;

		if (purgeDays >= 0 && entry.completed != 0 && dontLoadBefore > entry.completed) {
			return null;
		}

		let date = entry.date;
		if (date && date != "") {
			// The time needs to be appended to the date here to account for timezones
			date = new Date(entry.date+"T00:00:00.000");
		}

		return {date: date, completionDate: entry.completed};
	},

	registerSettings: function(){
		return [
			{
				"name": "defaultName",
				"description": "Default name when a todo is created",
				"type": "text",
				"default": "New todo",
			},
			{
				"name": "purgeCompleted",
				"description": "Delete completed todos after how many days? (negative for never)",
				"type": "number",
				"default": 30,
			},
		]
	},

	registerDocumentation: function() {
		return [
			"Add a todo by clicking on the add button.",
			"To edit a todo, click on it's background and this wil take you to the settings for that todo.",
			"On the settings page you can edit the due date and tasks on the todo.",
			"To add a new task, you can click on the add button, this will add a new task under the selected one.",
			"If you want to delete a task, you can click the x next to it, this will also delete all of it's children.",
			"If you want to delete a todo, you can either click on the delete button or you can delete the top task.",
			"If you decide that you do not want to edit a task at any time you can click cancel, escape, or click on the faded background.",
			"To save a task, you can either hit the save button or hit enter.",
			"Once you have your todo, you can mark them as completed from the dashboard.",
			"When the completed button is checked, all todos will be shown, when it is not checked only the non-completed todo will be shown.",
			"A completed task must have all of it's tasks checked.",
			"You can drag tasks around either when viewing them or in edit mode, in edit mode you can make a task the child of another by dragging it to the right side of another task.",
		]
	},
});
