'use strict';
dashboard.registerModule({
	name: "todo",
	displayName: "Todo List",
	version: "1.0.1",

	init: function(module){
		let _this = this;

		//due now button
		module.q(".dueNow").addEventListener("click", function(){
			let today = new Date();
			let now = _this.getFormattedDate(today);

			module.q(".dueSetting").value = now;
		});

		module.q(".clearDate").addEventListener("click", function(){
			module.q(".dueSetting").value = "";
		});

		//cancel button
		module.q(".cancelSetting").addEventListener("click", function(){
			_this.setSettingsHidden(module, true);
		});

		//save button
		module.q(".saveSetting").addEventListener("click", function(){
			//update the DOM
			_this.saveSettings(module);
		});

		//delete button
		module.q(".deleteSetting").addEventListener("click", function(){
			_this.deleteEditing(module);
		});

		//insert button
		module.q(".insertButton").addEventListener("click", function(){
			document.querySelector(".completed").checked = false;
			_this.hideFinishedTodos(module, true);
			_this.newTodo(module, false);
			_this.saveTodos(module);
		});

		//show all button
		module.q(".completed").addEventListener("change", function(){
			_this.hideFinishedTodos(module);
		});

		//cancel edit when clicking on the background
		module.q(".backgroundFade").addEventListener("click", function(){
			_this.setSettingsHidden(module, true);
		});

		//at the end of the move up and down buttons it saves, this is fine because any settings that have
		// been entered into settings haven't been written to the DOM yet, so those will not be saved.
		// This does mean that the move up and down options will not respect the save button despite
		// everything else in the settings pane doing so.
		module.q(".moveup").addEventListener("click", function(){
			let editing = module.q(".settings").editing;

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

		module.q(".movedown").addEventListener("click", function(){
			let editing = module.q(".settings").editing;

			//find the next non-hidden sibling
			let sibling = editing;
			do {
				sibling = sibling.nextElementSibling;

				//make sure that we don't move it past the bottom
				if (sibling == null || !sibling.classList.contains("todo_entry")) {
					sibling = module.q(".bottomAnchor");
				}
			} while (sibling.hidden);

			//make sure we go after the last element, we don't to use after() here because of the bottomAnchor
			sibling = sibling.nextElementSibling;
			if (sibling == null || !sibling.classList.contains("todo_entry"))
				sibling = module.q(".bottomAnchor");

			editing.parentNode.insertBefore(editing, sibling);
			_this.saveTodos(module);
		});

		//add an event listener to the body handle settings interaction
		document.querySelector("body").addEventListener("keyup", function(e){
			if(module.q(".settingsContainer").hidden)
				return;

			if (e.key == 'Escape') {
				_this.setSettingsHidden(module, true);
			} else if (e.key == "Enter" && !e.shiftKey) {
				_this.saveSettings(module);
			}
		});

		//don't type an enter when hitting enter with no shift in the description
		//	so that it bubbles and saves without having an enter character at the cursor
		module.q(".settings").addEventListener("keypress", function(e){
			if (e.key == "Enter" && !e.shiftKey) {
				e.preventDefault();
			}
		});

		//load todos
		this.loadTodos(module);
		this.hideFinishedTodos(module, true);

		//the current element being dragged
		module.getBaseModule().dragSrcElem = null;
	},

	//hides todos where none of the tasks are unchecked.
	// The hide argument is whether to hide them or unhide then, leaving it blank checks the complete checkbox
	hideFinishedTodos: function(module, hide){
		if (hide == undefined) {
			hide = !module.q(".completed").checked;
		}

		let list = module.q(".list");
		let todos = list.querySelectorAll(":scope > .todo_entry");
		for(let i=0; i<todos.length; i++) {
			todos[i].hidden = (hide == (todos[i].querySelector(".checkbox:not(:checked)") == null));
		}
	},

	saveSettings: function(module) {
		//save element being edited
		let editing = module.q(".settings").editing;
		let entries = editing.querySelector(".listEntryContainer");

		entries.innerHTML = "";
		let js = this.todoEntryToJSON(module.q(".settings").querySelector(".listEntry"), true);

		this.refreshList(module, js, entries, false);

		//save date
		let selectedDate = module.q(".dueSetting").value;
		editing.querySelector(".dueDate").innerHTML = selectedDate;

		//save description
		let description = module.q(".descriptionSetting").value;
		editing.querySelector(".description").innerHTML = description;

		this.setDateDisplay(editing.querySelector(".relativeDate"), selectedDate, editing.querySelector(".date"));

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

		if (days <= 0) {
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

	//warning: this function does not account for time zones
	getFormattedDate: function(date){
		let output = (""+date.getFullYear()).padStart(4,"0") + "-";
		output += (""+(date.getMonth()+1)).padStart(2,"0") + "-";
		output += (""+date.getDate()).padStart(2,"0");

		return output;
	},

	setSettingsHidden: function(module, value){
		module.q(".settingsContainer").hidden = value;

		if (!value) {
			module.q(".settingsContainer").querySelector(".title").focus();
		}
	},

	//given the task container, convert it to a JSON object, need to pass in if we are in editing mode or not
	todoEntryToJSON: function(task, editing) {
		//get values
		let checked = task.querySelector(".checkbox").checked;
		let children = task.querySelectorAll(":scope > .listEntry");

		let name;
		if (editing) {
			name = task.querySelector(".title").value;
		} else {
			name = task.querySelector(".title").innerHTML;
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
			obj[0].children = JSONChildren;

		return obj;
	},

	//save the todos to localStorage
	saveTodos: function(module){
		let obj = [];
		let list = module.q(".list");
		let todos = list.querySelectorAll(".todo_entry");
		for(let i=0; i<todos.length; i++) {
			//save the tasks
			let json = this.todoEntryToJSON(todos[i].querySelector(".listEntryContainer > .listEntry"), false);

			//save the description
			let description = todos[i].querySelector(".description").innerHTML;

			//save the dates
			let date = todos[i].querySelector(".dueDate").innerHTML;
			let completionDate = todos[i].querySelector(".completedDate").value;

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
			//the time needs to be appended to the date here to account for time zones
			this.newTodo(module, true, saved[i].tasks, date, saved[i].completed, saved[i].description);
		}
	},

	//Add event listeners to element to make it draggable, used by both the settings modal and display list
	makeDraggable: function(module, element) {
		let _this = this;
		element.draggable = true;
		let editMode = element.classList.contains("editable"); //if we're in the settings modal

		function removeDragClasses(e) {
			e.classList.remove("over-top");
			e.classList.remove("over-bottom");
			e.classList.remove("over-right");
		}

		//don't let a drag start when dragging on the textbox
		let title = element.querySelector(".title");
		title.addEventListener("mousedown", function(){
			element.draggable=false;
		});
		title.addEventListener("mouseleave", function(){
			element.draggable=true;
		});

		//begin drag
		element.addEventListener("dragstart", function(e){
			e.stopPropagation();
			module.getBaseModule().dragSrcElem = this;
		});

		//start drag over other
		element.addEventListener("dragover", function(e){
			//element cannot be moved into itself or it's child
			if (module.getBaseModule().dragSrcElem == this || module.getBaseModule().dragSrcElem.contains(this)) {
				return;
			}

			//don't let us drag the root element
			if (editMode && this.parentNode.classList.contains("listEntryContainer")) {
				return;
			}

			e.stopPropagation();
			e.preventDefault();

			//dragging on the top half vs the bottom half
			const rect = this.getBoundingClientRect();
			if (e.clientY < rect.top + this.offsetHeight * 0.5) {
				removeDragClasses(this);
				this.classList.add("over-top");
			} else {
				removeDragClasses(this);
				this.classList.add("over-bottom");
			}
			//If you drag on the right, add as a child instead of a sibling
			if (editMode && e.clientX > rect.left + this.offsetWidth * 0.5) {
				this.classList.add("over-right");
			}
		});

		//stop drag over other
		element.addEventListener("dragleave", function(){
			removeDragClasses(this);
		});

		//end drag
		element.addEventListener("drop", function(e){
			let dragSource = module.getBaseModule().dragSrcElem;

			//abort the drag if you're trying to drag from the settings page outside of it or vice versa
			if (this.classList.contains("editable") != dragSource.classList.contains("editable")) {
				removeDragClasses(this);
				return;
			}

			if (dragSource !== this) {
				//parent cannot be moved into itself
				if (dragSource.contains(this)) {
					return;
				}

				//don't let us drag the root element
				if (editMode && this.parentNode.classList.contains("listEntryContainer")) {
					return;
				}

				e.stopPropagation();
				//drop on right or left
				if (this.classList.contains("over-right")) {
					//drop above or below
					if (this.classList.contains("over-top")){
						this.appendChild(dragSource);
					} else {
						this.appendChild(dragSource);
					}
				} else {
					//drop above or below
					if (this.classList.contains("over-top")){
						this.parentNode.insertBefore(dragSource, this);
					} else {
						this.parentNode.insertBefore(dragSource, this.nextElementSibling);
					}
				}
			}
			removeDragClasses(this);
			if (!editMode) {
				_this.saveTodos(module);
			}
		});
	},

	refreshList: function(module, todoList, parent, editing){
		for(let i=0; i<todoList.length; i++) {
			let entry = document.createElement("div");
			entry.classList.add("listEntry");
			if (editing) {
				let dragArea = document.createElement("span");
				dragArea.innerHTML = '=';
				dragArea.classList.add("drag-handle");
				entry.appendChild(dragArea);
			}

			let checkbox = document.createElement("input");
			checkbox.type = "checkbox";
			checkbox.checked = todoList[i].checked;
			checkbox.classList.add("checkbox");
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
			name.classList.add("title");
			entry.appendChild(name);

			if (editing) {
				name.addEventListener("keydown",function(e){
					//allow navigation with ctrl+up/down
					if (e.ctrlKey){
						if (e.code == "ArrowDown") {
							let titles = module.qAll(".listEntry.editable>.title");
							let next = Array.from(titles).indexOf(document.activeElement) + 1;
							next = clamp(next, 0, titles.length-1);
							titles[next].focus();
						} else if (e.code == "ArrowUp") {
							let titles = module.qAll(".listEntry.editable>.title");
							let next = Array.from(titles).indexOf(document.activeElement) - 1;
							next = clamp(next, 0, titles.length-1);
							titles[next].focus();
						}
					}
				});
			}


			if (editing) {
				//Add marker that this is an editing listEntry
				entry.classList.add("editable");

				//don't make root node draggable
				if (!parent.classList.contains("listEntryContainer")) {
					this.makeDraggable(module, entry);
				}
			}

			if (editing) {
				let addButton = document.createElement("input");
				addButton.type = "button";
				addButton.value = "+";
				addButton.classList.add("spaced");

				let _this = this;
				addButton.addEventListener("click", function(){
					let defTodo = [{"name":getSetting(_this.name, "defaultName"), "checked":false}];
					_this.refreshList(module, defTodo, this.parentNode, editing);
				});
				entry.appendChild(addButton);

				let removeButton = document.createElement("input");
				removeButton.type = "button";
				removeButton.value = "X";
				removeButton.classList.add("spaced");

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
		let todo = child.closest(".todo_entry");
		let unchecked = todo.querySelector(".checkbox:not(:checked)");
		let dateElement = todo.querySelector(".completedDate");
		if (!unchecked) {
			//set the datetime that it was completed
			dateElement.value = Date.now();
			todo.querySelector(".completedDisplay").innerHTML = "Completed: " + this.getFormattedDate(new Date(+dateElement.value));
		} else {
			dateElement.value = 0;
			todo.querySelector(".completedDisplay").innerHTML = "";
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
			todoDate = "";
		}

		if (todoDate != ""){
			element.querySelector(".dueDate").innerHTML = _this.getFormattedDate(todoDate);
			this.setDateDisplay(element.querySelector(".relativeDate"), new Date(_this.getFormattedDate(todoDate)), element.querySelector(".date"));
		}

		//set the description
		if (description)
			element.querySelector(".description").innerHTML = description;

		//set the completion date
		if (!completionDate) {
			completionDate = 0;
		} else if (completionDate !== "0") {
			element.querySelector(".completedDisplay").innerHTML = "Completed: " + this.getFormattedDate(new Date(+completionDate));
		}
		element.querySelector(".completedDate").value = completionDate;

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
			if (!classList.contains("checkbox"))
				_this.editTodo(module, element);
		});

		this.makeDraggable(module, element);

		//put at the top or bottom of the list depending on append
		let firstTodo = module.qAll(".todo_entry")[0];
		if (append || !firstTodo) {
			module.q(".list").insertBefore(fragment, module.q(".bottomAnchor"));
		} else {
			module.q(".list").insertBefore(fragment, firstTodo);
		}
	},

	editTodo: function(module, todo){
		//remember what is being edited
		module.q(".settings").editing = todo;

		//copy nested todo to settings
		let json = this.todoEntryToJSON(todo.querySelector(".listEntry"), false);
		let todoEditingElement = module.q(".settings").querySelector(".listEntryContainer");
		todoEditingElement.innerHTML = "";
		this.refreshList(module, json, todoEditingElement, true);

		module.q(".dueSetting").value = todo.querySelector(".dueDate").innerHTML;
		module.q(".descriptionSetting").value = todo.querySelector(".description").innerHTML;


		//close popup
		this.setSettingsHidden(module, false);
	},

	deleteEditing: function(module){
		let shouldContinue = confirm("Are you sure that you would like to delete this todo?");

		if (!shouldContinue)
			return;

		module.q(".settings").editing.remove();
		this.setSettingsHidden(module, true);
		this.saveTodos(module);
	},

	instantiate: function(where){
		where.innerHTML = /*html*/`
			<div class="fs30b">Todo List</div>
			<div class="settingsContainer" hidden>
				<div class="settings">
					<input type="button" class="saveSetting" value="Save">
					<input type="button" class="cancelSetting" value="Cancel">
					<input type="button" class="deleteSetting" value="Delete">
					<br/>
					<input type="button" class="moveup" value="Move up">
					<input type="button" class="movedown" value="Move down">
					<br/><br/>
					<div class="listEntryContainer"></div>
					<br/>
					<textarea class="descriptionSetting" placeholder="Description"></textarea>
					<br/><br/>
					<input type="date" class="dueSetting">
					<input type="button" class="dueNow" value="Today">
					<input type="button" class="clearDate" value="Clear">
				</div>
				<div class="backgroundFade"></div>
			</div>
			<input type="button" class="insertButton" value="+">
			<input type="checkbox" class="completed" id="completed">
			<label for="completed">Complete</label>
			<br/>
			<div class="list">
				<template class="todo_tmplt">
					<div class="todo_entry">
						<div class="listEntryContainer"></div>
						<div class="description"></div>
						<div class="date">
							<span class="dueDate colorOverride"></span><span class="relativeDate colorOverride"></span>
						</div>
						<span class="completedDisplay colorOverride"></span>
						<input type="hidden" class="completedDate" value="0">
					</div>
				</template>
				<input type="hidden" class="bottomAnchor">
			</div>
		`;
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
			"If you want to delete a task, you can click the x next to it, this will also delete all of it's children.",
			"If you want to delete a todo, you can either click on the delete button or you can delete the top task.",
			"If you decide that you do not want to edit a task at any time you can click cancel, escape, or click on the faded background.",
			"To save a task, you can either hit the save button or hit enter.",
			"Once you have your todo, you can mark them as completed from the dashboard.",
			"When the Show all button is checked, all todos will be shown, when it is not checked only the non-completed todo will be shown.",
			"A completed task must have all of it's tasks checked.",
		]
	},
});

