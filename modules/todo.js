'use strict';
dashboard.registerModule({
	name: "todo",
	displayName: "Todo List",
	version: "1.0.1",

	init: function(inst){
		const _this = this;

		//due now button
		inst.q(".dueNow").addEventListener("click", function(){
			const today = new Date();
			const now = _this.getFormattedDate(today);

			inst.q(".dueSetting").value = now;
		});

		inst.q(".clearDate").addEventListener("click", function(){
			inst.q(".dueSetting").value = "";
		});

		//cancel button
		inst.q(".cancelSetting").addEventListener("click", function(){
			_this.setSettingsHidden(inst, true);
		});

		//save button
		inst.q(".saveSetting").addEventListener("click", function(){
			//update the DOM
			_this.saveSettings(inst);
		});

		//delete button
		inst.q(".deleteSetting").addEventListener("click", function(){
			_this.deleteEditing(inst);
		});

		//insert button
		inst.q(".insertButton").addEventListener("click", function(){
			inst.q(".completed").checked = false;
			_this.hideFinishedTodos(inst, true);
			_this.newTodo(inst, false);
			_this.saveTodos(inst);
		});

		//show all button
		inst.q(".completed").addEventListener("change", function(){
			_this.hideFinishedTodos(inst);
		});

		//cancel edit when clicking on the background
		inst.q(".backgroundFade").addEventListener("click", function(){
			_this.setSettingsHidden(inst, true);
		});

		//at the end of the move up and down buttons it saves, this is fine because any settings that have
		// been entered into settings haven't been written to the DOM yet, so those will not be saved.
		// This does mean that the move up and down options will not respect the save button despite
		// everything else in the settings pane doing so.
		inst.q(".moveup").addEventListener("click", function(){
			const editing = inst.q(".settings").editing;

			//find the next non-hidden sibling
			let sibling = editing;
			do {
				sibling = sibling.previousElementSibling;

				//make sure that we don't move it past the top
				if (sibling == null || !sibling.classList.contains("todo_entry"))
					return;
			} while (sibling.hidden);

			editing.parentNode.insertBefore(editing, sibling);
			_this.saveTodos(inst);
		});

		inst.q(".movedown").addEventListener("click", function(){
			const editing = inst.q(".settings").editing;

			//find the next non-hidden sibling
			let sibling = editing;
			do {
				sibling = sibling.nextElementSibling;

				//make sure that we don't move it past the bottom
				if (sibling == null || !sibling.classList.contains("todo_entry")) {
					sibling = inst.q(".bottomAnchor");
				}
			} while (sibling.hidden);

			//make sure we go after the last element, we don't to use after() here because of the bottomAnchor
			sibling = sibling.nextElementSibling;
			if (sibling == null || !sibling.classList.contains("todo_entry"))
				sibling = inst.q(".bottomAnchor");

			editing.parentNode.insertBefore(editing, sibling);
			_this.saveTodos(inst);
		});

		//add an event listener to the body handle settings interaction
		document.querySelector("body").addEventListener("keyup", function(e){
			if(inst.q(".settingsContainer").hidden)
				return;

			if (e.key == 'Escape') {
				_this.setSettingsHidden(inst, true);
			} else if (e.key === "Enter" && !e.shiftKey) {
				_this.saveSettings(inst);
			}
		});

		//don't type an enter when hitting enter with no shift in the description
		//	so that it bubbles and saves without having an enter character at the cursor
		inst.q(".settings").addEventListener("keypress", function(e){
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
			}
		});

		//load todos
		this.loadTodos(inst);
		this.hideFinishedTodos(inst, true);

		//the current element being dragged
		inst.getInstanceRoot().dragSrcElem = null;

		//apply labels
		const completedId = "completed" + inst.getId();
		inst.q(".completed").id = completedId;
		inst.q(".completedLabel").setAttribute("for", completedId);
	},

	//hides todos where none of the tasks are unchecked.
	// The hide argument is whether to hide them or unhide then, leaving it blank checks the complete checkbox
	hideFinishedTodos: function(inst, hide){
		if (hide == undefined) {
			hide = !inst.q(".completed").checked;
		}

		const list = inst.q(".list");
		const todos = list.querySelectorAll(":scope > .todo_entry");
		for(let i=0; i<todos.length; i++) {
			todos[i].hidden = (hide == (todos[i].querySelector(".checkbox:not(:checked)") == null));
		}
	},

	saveSettings: function(inst) {
		//save element being edited
		const editing = inst.q(".settings").editing;
		const entries = editing.querySelector(".listEntryContainer");

		entries.innerHTML = "";
		const js = this.todoEntryToJSON(inst.q(".settings").querySelector(".listEntry"), true);

		this.refreshList(inst, js, entries, false);

		//save date
		const selectedDate = inst.q(".dueSetting").value;
		editing.querySelector(".dueDate").innerHTML = selectedDate;

		//save description
		const description = inst.q(".descriptionSetting").value;
		editing.querySelector(".description").innerHTML = description;

		this.setDateDisplay(editing.querySelector(".relativeDate"), selectedDate, editing.querySelector(".date"));

		//check if the todo was completed in editing mode
		this.updateCompleted(editing);
		this.hideFinishedTodos(inst);

		//hide settings
		this.setSettingsHidden(inst, true);

		//save all todos to localStorage
		this.saveTodos(inst);
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
		const msPerDay = 1000*60*60*24;
		const currentDay = new Date(this.getFormattedDate(new Date()));
		const days = (date/msPerDay - Math.floor(currentDay/msPerDay));
		return days;
	},

	//warning: this function does not account for time zones
	getFormattedDate: function(date){
		let output = (""+date.getFullYear()).padStart(4,"0") + "-";
		output += (""+(date.getMonth()+1)).padStart(2,"0") + "-";
		output += (""+date.getDate()).padStart(2,"0");

		return output;
	},

	setSettingsHidden: function(inst, value){
		inst.q(".settingsContainer").hidden = value;

		if (!value) {
			inst.q(".settingsContainer").querySelector(".title").focus();
		}
	},

	//given the task container, convert it to a JSON object, need to pass in if we are in editing mode or not
	todoEntryToJSON: function(task, editing) {
		//get values
		const checked = task.querySelector(".checkbox").checked;
		const children = task.querySelectorAll(":scope > .listEntry");

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
				const newChild = this.todoEntryToJSON(children[i], editing);
				JSONChildren = JSONChildren.concat(newChild);
			}
		}

		//build object
		const obj = [{"name": name, "checked": checked}];
		if (JSONChildren)
			obj[0].children = JSONChildren;

		return obj;
	},

	//save the todos to localStorage
	saveTodos: function(inst){
		const obj = [];
		const list = inst.q(".list");
		const todos = list.querySelectorAll(".todo_entry");
		for(let i=0; i<todos.length; i++) {
			//save the tasks
			const json = this.todoEntryToJSON(todos[i].querySelector(".listEntryContainer > .listEntry"), false);

			//save the description
			const description = todos[i].querySelector(".description").innerHTML;

			//save the dates
			const date = todos[i].querySelector(".dueDate").innerHTML;
			const completionDate = todos[i].querySelector(".completedDate").value;

			const todo = {"date": date, "tasks": json, "description": description,"completed": completionDate};
			obj.push(todo);
		}

		//write to localstorage
		localStorage.setItem("td_todos", JSON.stringify(obj));
	},

	//load the todos from localStorage
	loadTodos: function(inst){
		const saved = JSON.parse(localStorage.getItem("td_todos"));

		if (!saved)
			return;

		for(let i=0; i<saved.length; i++) {
			//don't load any todos that need to be purged
			const purgeDays = getSetting(this.name,"purgeCompleted");
			const dontLoadBefore = Date.now() - purgeDays*1000*60*60*24;

			if (purgeDays >= 0 && saved[i].completed != 0 && dontLoadBefore > saved[i].completed) {
				continue;
			}

			let date = saved[i].date;
			if (date && date != "") {
				date = new Date(saved[i].date+"T00:00:00.000");
			}
			//the time needs to be appended to the date here to account for time zones
			this.newTodo(inst, true, saved[i].tasks, date, saved[i].completed, saved[i].description);
		}
	},

	//Add event listeners to element to make it draggable, used by both the settings modal and display list
	makeDraggable: function(inst, element) {
		const _this = this;
		element.draggable = true;
		const editMode = element.classList.contains("editable"); //if we're in the settings modal

		function removeDragClasses(e) {
			e.classList.remove("over-top");
			e.classList.remove("over-bottom");
			e.classList.remove("over-right");
		}

		//don't let a drag start when dragging on the textbox
		const title = element.querySelector(".title");
		title.addEventListener("mousedown", function(){
			element.draggable=false;
		});
		title.addEventListener("mouseleave", function(){
			element.draggable=true;
		});

		//begin drag
		element.addEventListener("dragstart", function(e){
			e.stopPropagation();
			inst.getInstanceRoot().dragSrcElem = this;
		});

		//start drag over other
		element.addEventListener("dragover", function(e){
			//element cannot be moved into itself or it's child
			if (inst.getInstanceRoot().dragSrcElem == this || inst.getInstanceRoot().dragSrcElem.contains(this)) {
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
			const dragSource = inst.getInstanceRoot().dragSrcElem;

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
				_this.saveTodos(inst);
			}
		});
	},

	refreshList: function(inst, todoList, parent, editing){
		for(let i=0; i<todoList.length; i++) {
			const entry = document.createElement("div");
			entry.classList.add("listEntry");
			if (editing) {
				const dragArea = document.createElement("span");
				dragArea.innerHTML = '=';
				dragArea.classList.add("drag-handle");
				entry.appendChild(dragArea);
			}

			const checkbox = document.createElement("input");
			checkbox.type = "checkbox";
			checkbox.checked = todoList[i].checked;
			checkbox.classList.add("checkbox");
			checkbox.setAttribute("autocomplete", "off");
			entry.appendChild(checkbox);

			const _this = this;

			if (!editing) {
				checkbox.addEventListener("change", function(){
					//rehide all the completed tasks
					_this.hideFinishedTodos(inst);

					_this.updateCompleted(checkbox);

					//save
					_this.saveTodos(inst);
				});
			}

			let name;
			if (editing) {
				name = document.createElement("input");
				name.type = "text";
				name.setAttribute("autocomplete", "off");
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
						if (e.code === "ArrowDown") {
							const titles = inst.qAll(".listEntry.editable>.title");
							let next = Array.from(titles).indexOf(document.activeElement) + 1;
							next = clamp(next, 0, titles.length-1);
							titles[next].focus();
						} else if (e.code === "ArrowUp") {
							const titles = inst.qAll(".listEntry.editable>.title");
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
					this.makeDraggable(inst, entry);
				}
			}

			if (editing) {
				const addButton = document.createElement("input");
				addButton.type = "button";
				addButton.value = "+";
				addButton.classList.add("spaced");
				addButton.setAttribute("autocomplete", "off");

				const _this = this;
				addButton.addEventListener("click", function(){
					const defTodo = [{"name":getSetting(_this.name, "defaultName"), "checked":false}];
					_this.refreshList(inst, defTodo, this.parentNode, editing);
				});
				entry.appendChild(addButton);

				const removeButton = document.createElement("input");
				removeButton.type = "button";
				removeButton.value = "X";
				removeButton.classList.add("spaced");
				removeButton.setAttribute("autocomplete", "off");

				removeButton.addEventListener("click", function(){
					//delete the task or the whole todo if it's the root task
					if (parent.classList.contains("listEntry")) {
						this.parentNode.remove();
					} else {
						_this.deleteEditing(inst);
					}
				});

				entry.appendChild(removeButton);
			}

			//iterate the children
			if (todoList[i].children) {
				this.refreshList(inst, todoList[i].children, entry, editing);
			}

			parent.appendChild(entry);
		}
	},

	updateCompleted: function(child){
		const todo = child.closest(".todo_entry");
		const unchecked = todo.querySelector(".checkbox:not(:checked)");
		const dateElement = todo.querySelector(".completedDate");
		if (!unchecked) {
			//set the datetime that it was completed
			dateElement.value = Date.now();
			todo.querySelector(".completedDisplay").innerHTML = "Completed: " + this.getFormattedDate(new Date(+dateElement.value));
		} else {
			dateElement.value = 0;
			todo.querySelector(".completedDisplay").innerHTML = "";
		}
	},

	newTodo: function(inst, append, JSONTasks, date, completionDate, description){
		const _this = this;

		const fragment = inst.q(".todo_tmplt").content.cloneNode(true);
		const element = fragment.children[0];

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
			tasks = JSONTasks;
		} else {
			tasks = [{"name":getSetting(_this.name, "defaultName"), "checked":false}];
		}
		this.refreshList(inst, tasks, element.querySelector(".listEntryContainer"), false);

		//setup settings trigger
		element.addEventListener("click", function(e){
			const classList = e.target.classList;
			if (!classList.contains("checkbox"))
				_this.editTodo(inst, element);
		});

		this.makeDraggable(inst, element);

		//put at the top or bottom of the list depending on append
		const firstTodo = inst.qAll(".todo_entry")[0];
		if (append || !firstTodo) {
			inst.q(".list").insertBefore(fragment, inst.q(".bottomAnchor"));
		} else {
			inst.q(".list").insertBefore(fragment, firstTodo);
		}
	},

	editTodo: function(inst, todo){
		//remember what is being edited
		inst.q(".settings").editing = todo;

		//copy nested todo to settings
		const json = this.todoEntryToJSON(todo.querySelector(".listEntry"), false);
		const todoEditingElement = inst.q(".settings").querySelector(".listEntryContainer");
		todoEditingElement.innerHTML = "";
		this.refreshList(inst, json, todoEditingElement, true);

		inst.q(".dueSetting").value = todo.querySelector(".dueDate").innerHTML;
		inst.q(".descriptionSetting").value = todo.querySelector(".description").innerHTML;


		//close popup
		this.setSettingsHidden(inst, false);
	},

	deleteEditing: function(inst){
		const shouldContinue = db_confirm("Are you sure that you would like to delete this todo?");

		if (!shouldContinue)
			return;

		inst.q(".settings").editing.remove();
		this.setSettingsHidden(inst, true);
		this.saveTodos(inst);
	},

	instantiate: function(where){
		where.innerHTML = /*html*/`
			<div class="fs30b">Todo List</div>
			<div class="settingsContainer" hidden>
				<div class="settings">
					<input type="button" class="saveSetting" value="Save" autocomplete="off"/>
					<input type="button" class="cancelSetting" value="Cancel" autocomplete="off"/>
					<input type="button" class="deleteSetting" value="Delete" autocomplete="off"/>
					<br/>
					<input type="button" class="moveup" value="Move up" autocomplete="off"/>
					<input type="button" class="movedown" value="Move down" autocomplete="off"/>
					<br/><br/>
					<div class="listEntryContainer"></div>
					<br/>
					<textarea class="descriptionSetting" placeholder="Description"></textarea>
					<br/><br/>
					<input type="date" class="dueSetting" autocomplete="off"/>
					<input type="button" class="dueNow" value="Today" autocomplete="off"/>
					<input type="button" class="clearDate" value="Clear" autocomplete="off"/>
				</div>
				<div class="backgroundFade"></div>
			</div>
			<input type="button" class="insertButton" value="+" autocomplete="off"/>
			<input type="checkbox" class="completed" autocomplete="off"/>
			<label class="completedLabel">Complete</label>
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
						<input type="hidden" class="completedDate" value="0" autocomplete="off"/>
					</div>
				</template>
				<input type="hidden" class="bottomAnchor" autocomplete="off"/>
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
			"You can drag tasks around either when viewing them or in edit mode, in edit mode you can make a task the child of another by dragging it to the right side of another task.",
		]
	},
});
