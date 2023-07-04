dashboard.registerModule({
	name: "todo",
	displayName: "Todo List",

	init: function(module){
		let _this = this;

		//due now button
		module.q(".td_dueNow").addEventListener("click", function(){
			let today = new Date();
			let now = _this.getFormattedDate(today);

			module.q(".td_dueSetting").value = now;
		});

		module.q(".td_clearDate").addEventListener("click", function(){
			module.q(".td_dueSetting").value = "";
		});

		//cancel button
		module.q(".td_cancelSetting").addEventListener("click", function(){
			_this.setSettingsHidden(module, true);
		});

		//save button
		module.q(".td_saveSetting").addEventListener("click", function(){
			//update the DOM
			_this.saveSettings(module);
		});

		//delete button
		module.q(".td_deleteSetting").addEventListener("click", function(){
			_this.deleteEditing(module);
		});

		//insert button
		module.q(".td_insertButton").addEventListener("click", function(){
			document.querySelector(".td_completed").checked = false;
			_this.hideFinishedTodos(module, true);
			_this.newTodo(module, false);
			_this.saveTodos(module);
		});

		//show all button
		module.q(".td_completed").addEventListener("change", function(){
			_this.hideFinishedTodos(module);
		});

		//cancel edit when clicking on the background
		module.q(".td_backgroundFade").addEventListener("click", function(){
			_this.setSettingsHidden(module, true);
		});

		//at the end of the move up and down buttons it saves, this is fine because any settings that have
		// been entered into settings haven't been written to the DOM yet, so those will not be saved.
		// This does mean that the move up and down options will not respect the save button despite
		// everything else in the settings pane doing so.
		module.q(".td_moveup").addEventListener("click", function(){
			let editing = module.q(".td_settings").editing;

			//find the next non-hidden sibling
			let sibling = editing;
			do {
				sibling = sibling.previousElementSibling;

				//make sure that we don't move it past the top
				if (sibling == null || !sibling.classList.contains("todo_entry"))
					return;
			} while (sibling.hidden);

			editing.parentNode.insertBefore(editing, sibling);
			_this.saveTodos(module);
		});

		module.q(".td_movedown").addEventListener("click", function(){
			let editing = module.q(".td_settings").editing;

			//find the next non-hidden sibling
			let sibling = editing;
			do {
				sibling = sibling.nextElementSibling;

				//make sure that we don't move it past the bottom
				if (sibling == null || !sibling.classList.contains("todo_entry")) {
					sibling = module.q(".td_bottomAnchor");
				}
			} while (sibling.hidden);

			//make sure we go after the last element, we don't to use after() here because of the bottomAnchor
			sibling = sibling.nextElementSibling;
			if (sibling == null || !sibling.classList.contains("todo_entry"))
				sibling = module.q(".td_bottomAnchor");

			editing.parentNode.insertBefore(editing, sibling);
			_this.saveTodos(module);
		});

		//add an event listener to the body handle settings interaction
		document.querySelector("body").addEventListener("keyup", function(e){
			if(module.q(".td_settingsContainer").hidden)
				return;

			if (e.key == 'Escape') {
				_this.setSettingsHidden(module, true);
			} else if (e.key == "Enter" && !e.shiftKey) {
				_this.saveSettings(module);
			}
		});

		//load todos
		this.loadTodos(module);
		this.hideFinishedTodos(module, true);
	},

	//hides todos where none of the tasks are unchecked.
	// The hide argument is whether to hide them or unhide then, leaving it blank checks the complete checkbox
	hideFinishedTodos: function(module, hide){
		if (hide == undefined) {
			hide = !module.q(".td_completed").checked;
		}

		let list = module.q(".td_list");
		let todos = list.querySelectorAll(":scope > .todo_entry");
		for(let i=0; i<todos.length; i++) {
			todos[i].hidden = (hide == (todos[i].querySelector(".td_checkbox:not(:checked)") == null));
		}
	},

	saveSettings: function(module) {
		//save element being edited
		let editing = module.q(".td_settings").editing;
		let entries = editing.querySelector(".listEntryContainer");

		entries.innerHTML = "";
		let js = this.todoEntryToJSON(module.q(".td_settings").querySelector(".listEntry"), true);

		this.refreshList(module, js, entries, false);

		//save date
		let selectedDate = module.q(".td_dueSetting").value;
		editing.querySelector(".td_dueDate").innerHTML = selectedDate;

		//save description
		let description = module.q(".td_descriptionSetting").value;
		editing.querySelector(".td_description").innerHTML = description;

		this.setDateDisplay(editing.querySelector(".td_relativeDate"), selectedDate, editing.querySelector(".td_date"));

		//check if the todo was completed in editing mode
		this.updateCompleted(editing);
		this.hideFinishedTodos(module);

		//hide settings
		this.setSettingsHidden(module, true);

		//save all todos to localStorage
		this.saveTodos(module);
	},

	//set the relative days amount and add sets "due" class on colorElement
	setDateDisplay: function(element, date, colorElement) {
		let text = "";
		let days = 0;
		if (date !== "") {
			days = this.getRelativeDate(new Date(date));
			text = ", " + days + " days";
		}

		element.innerHTML = text;

		if (days < 0) {
			colorElement.classList.add("due");
		} else {
			colorElement.classList.remove("due");
		}
	},

	getRelativeDate: function(date){
		let msPerDay = 1000*60*60*24;
		let currentDay = new Date(this.getFormattedDate(new Date()));
		let days = (date/msPerDay - Math.floor(currentDay/msPerDay));
		return days;
	},

	//warning: this function does not account for timezones
	getFormattedDate: function(date){
		let output = (""+date.getFullYear()).padStart(4,"0") + "-";
		output += (""+(date.getMonth()+1)).padStart(2,"0") + "-";
		output += (""+date.getDate()).padStart(2,"0");

		return output;
	},

	setSettingsHidden: function(module, value){
		module.q(".td_settingsContainer").hidden = value;

		if (!value) {
			module.q(".td_settingsContainer").querySelector(".td_title").focus();
		}
	},

	//given the task container, convert it to a JSON object, need to pass in if we are in editing mode or not
	todoEntryToJSON: function(task, editing) {
		//get values
		let checked = task.querySelector(".td_checkbox").checked;
		let children = task.querySelectorAll(":scope > .listEntry");

		let name;
		if (editing) {
			name = task.querySelector(".td_title").value;
		} else {
			name = task.querySelector(".td_title").innerHTML;
		}

		//build children
		let JSONChildren;
		if (children.length > 0) {
			JSONChildren = [];
			for(let i=0; i<children.length; i++) {
				let newChild = this.todoEntryToJSON(children[i], editing);
				JSONChildren = JSONChildren.concat(newChild);
			}
		}

		//build object
		let obj = [{"name": name, "checked": checked}];
		if (JSONChildren)
			obj[0]["children"] = JSONChildren;

		return obj;
	},

	//save the todos to localStorage
	saveTodos: function(module){
		let obj = [];
		let list = module.q(".td_list");
		let todos = list.querySelectorAll(".todo_entry");
		for(let i=0; i<todos.length; i++) {
			//save the tasks
			let json = this.todoEntryToJSON(todos[i].querySelector(".listEntryContainer > .listEntry"), false);

			//save the description
			let description = todos[i].querySelector(".td_description").innerHTML;

			//save the dates
			let date = todos[i].querySelector(".td_dueDate").innerHTML;
			let completionDate = todos[i].querySelector(".td_completedDate").value;

			let todo = {"date": date, "tasks": json, "description": description,"completed": completionDate};
			obj.push(todo);
		}

		//write to localstorage
		localStorage.setItem("td_todos", JSON.stringify(obj));
	},

	//load the todos from localStorage
	loadTodos: function(module){
		let saved = localStorage.getItem("td_todos");

		if (!saved)
			return;

		saved = JSON.parse(saved);

		for(let i=0; i<saved.length; i++) {
			//don't load any todos that need to be purged
			let purgeDays = getSetting(this.name,"purgeCompleted");
			let dontLoadBefore = Date.now() - purgeDays*1000*60*60*24;

			if (purgeDays >= 0 && saved[i].completed != 0 && dontLoadBefore > saved[i].completed) {
				continue;
			}

			let date = saved[i].date;
			if (date && date != "") {
				date = new Date(saved[i].date+"T00:00:00.000");
			}
			//the time needs to be appended to the date here to account for timezones
			this.newTodo(module, true, saved[i].tasks, date, saved[i].completed, saved[i].description);
		}
	},

	refreshList: function(module, todoList, parent, editing){
		for(let i=0; i<todoList.length; i++) {
			let entry = document.createElement("div");
			entry.classList.add("listEntry");

			let checkbox = document.createElement("input");
			checkbox.type = "checkbox";
			checkbox.checked = todoList[i].checked;
			checkbox.classList.add("td_checkbox");
			entry.appendChild(checkbox);

			let _this = this;

			if (!editing) {
				checkbox.addEventListener("change", function(){
					//rehide all the completed tasks
					_this.hideFinishedTodos(module);

					_this.updateCompleted(checkbox);

					//save
					_this.saveTodos(module);
				});
			}

			let name;
			if (editing) {
				name = document.createElement("input");
				name.type = "text";
				name.value = todoList[i].name;
			} else {
				name = document.createElement("span");
				name.innerHTML = todoList[i].name;
			}
			name.classList.add("td_title")
			entry.appendChild(name);

			if (editing) {
				let addButton = document.createElement("input");
				addButton.type = "button";
				addButton.value = "+";

				let _this = this;
				addButton.addEventListener("click", function(){
					let defTodo = [{"name":getSetting(_this.name, "defaultName"), "checked":false}];
					_this.refreshList(module, defTodo, this.parentNode, editing);
				});
				entry.appendChild(addButton);

				let removeButton = document.createElement("input");
				removeButton.type = "button";
				removeButton.value = "x";

				removeButton.addEventListener("click", function(){
					//delete the task or the whole todo if it's the root task
					if (parent.classList.contains("listEntry")) {
						this.parentNode.remove();
					} else {
						_this.deleteEditing(module)
					}
				});

				entry.appendChild(removeButton);
			}

			//iterate the children
			if (todoList[i].children) {
				this.refreshList(module, todoList[i].children, entry, editing);
			}

			parent.appendChild(entry);
		}
	},

	updateCompleted: function(child){
		let todo = getParentOfClass(child, "todo_entry");
		let unchecked = todo.querySelector(".td_checkbox:not(:checked)");
		if (!unchecked) {
			//set the datetime that it was completed
			todo.querySelector(".td_completedDate").value = Date.now();
		} else {
			todo.querySelector(".td_completedDate").value = 0;
		}
	},

	newTodo: function(module, append, JSONTasks, date, completionDate, description){
		let _this = this;

		let fragment = module.q(".todo_tmplt").content.cloneNode(true);
		let element = fragment.children[0];

		//set the default date
		let todoDate;
		if (date) {
			todoDate = date;
		} else {
			todoDate = new Date();
		}

		if (date != ""){
			element.querySelector(".td_dueDate").innerHTML = _this.getFormattedDate(todoDate);
			this.setDateDisplay(element.querySelector(".td_relativeDate"), new Date(_this.getFormattedDate(todoDate)), element.querySelector(".td_date"));
		}

		//set the description
		if (description)
			element.querySelector(".td_description").innerHTML = description;

		//set the completion date
		if (!completionDate)
			completionDate = 0;
		element.querySelector(".td_completedDate").value = completionDate;

		//set default todo
		let tasks;
		if (JSONTasks) {
			tasks = JSONTasks
		} else {
			tasks = [{"name":getSetting(_this.name, "defaultName"), "checked":false}];
		}
		this.refreshList(module, tasks, element.querySelector(".listEntryContainer"), false);

		//setup settings trigger
		element.addEventListener("click", function(e){
			let classList = e.target.classList;
			if (!classList.contains("td_checkbox"))
				_this.editTodo(module, element);
		});

		//put at the top or bottom of the list depending on append
		let firstTodo = module.q(".todo_entry");
		if (append || firstTodo == null) {
			module.q(".td_list").insertBefore(fragment, module.q(".td_bottomAnchor"));
		} else {
			module.q(".td_list").insertBefore(fragment, firstTodo);
		}
	},

	editTodo: function(module, todo){
		//remember what is being edited
		module.q(".td_settings").editing = todo;

		//copy nested todo to settings
		let json = this.todoEntryToJSON(todo.querySelector(".listEntry"), false);
		let todoEditingElement = module.q(".td_settings").querySelector(".listEntryContainer");
		todoEditingElement.innerHTML = "";
		this.refreshList(module, json, todoEditingElement, true);

		module.q(".td_dueSetting").value = todo.querySelector(".td_dueDate").innerHTML;
		module.q(".td_descriptionSetting").value = todo.querySelector(".td_description").innerHTML;


		//close popup
		this.setSettingsHidden(module, false);
	},

	deleteEditing: function(module){
		let shouldContinue = confirm("Are you sure that you would like to delete this todo?");

		if (!shouldContinue)
			return;

		module.q(".td_settings").editing.remove();
		this.setSettingsHidden(module, true);
		this.saveTodos(module);
	},

	instantiate: function(where){
		where.innerHTML = /*html*/`
			<div class="fs30b">Todo List</div>
			<div class="td_settingsContainer" hidden>
				<div class="td_settings">
					<input type="button" class="td_saveSetting" value="Save">
					<input type="button" class="td_cancelSetting" value="Cancel">
					<input type="button" class="td_deleteSetting" value="Delete">
					<br/>
					<input type="button" class="td_moveup" value="Move up">
					<input type="button" class="td_movedown" value="Move down">
					<br/><br/>
					<div class="listEntryContainer"></div>
					<br/>
					<textarea class="td_descriptionSetting" placeholder="Description"></textarea>
					<br/><br/>
					<input type="date" class="td_dueSetting">
					<input type="button" class="td_dueNow" value="Today">
					<input type="button" class="td_clearDate" value="Clear">
				</div>
				<div class="td_backgroundFade"></div>
			</div>
			<input type="button" class="td_insertButton" value="+">
			<input type="checkbox" class="td_completed" id="td_completed">
			<label for="td_completed">Complete</label>
			<br/><br/>
			<div class="td_list">
				<template class="todo_tmplt">
					<div class="todo_entry">
						<div class="listEntryContainer"></div>
						<div class="td_description"></div>
						<div class="td_date">
							<span class="td_dueDate colorOverride"></span><span class="td_relativeDate colorOverride"></span>
						</div>
						<input type="hidden" class="td_completedDate" value="0">
					</div>
				</template>
				<input type="hidden" class="td_bottomAnchor">
			</div>
		`
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

	registerDocumentation: function(){
		return [
			"Add a todo by clicking on the add button.",
			"To edit a todo, click on it's background and this wil take you to the settings for that todo.",
			"On the settings page you can edit the due date and tasks on the todo.",
			"To add a new task, you can click on the add button, this will add a new task under the selected one.",
			"If you want to delete a task, you can click the x next to it, this will also delete all of it's childre.",
			"If you want to delete a todo, you can either click on the delete button or you can delete the top task.",
			"If you decide that you do not want to edit a task at any time you can click cancel, escape, or click on the faded background.",
			"To save a task, you can either hit the save button or hit enter.",
			"Once you have your todo, you can mark them as completed from the dashboard.",
			"When the Show all button is checked, all todos will be shown, when it is not checked only the non-completed todo will be shown.",
			"A completed task must have all of it's tasks checked.",
		]
	},
});

