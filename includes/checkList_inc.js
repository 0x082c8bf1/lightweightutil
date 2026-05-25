dashboard.registerInclude({
	name: "checkList_inc",

	apply: function(module) {
		_this = this;

		module.checklist_init = function(inst){
			// Needed to get inherited styles to apply.
			inst.getInstanceRoot().classList.add("checklist");

			const _this = this;

			// Cancel button
			inst.q(".cancelSetting").addEventListener("click", function(){
				_this.setSettingsHidden(inst, true);
			});

			// Save button
			inst.q(".saveSetting").addEventListener("click", function(){
				// Update the DOM
				_this.saveSettings(inst);
			});

			// Delete button
			inst.q(".deleteSetting").addEventListener("click", function(){
				_this.deleteEditing(inst);
			});

			// Insert button
			inst.q(".insertButton").addEventListener("click", function(){
				_this.newTask(inst, false);
				_this.saveTasks(inst);
				module.insertHook(inst);
				_this.applyFilters(inst);
			});

			// Cancel edit when clicking on the background
			inst.q(".backgroundFade").addEventListener("click", function(){
				_this.setSettingsHidden(inst, true);
			});

			// At the end of the move up and down buttons it saves, this is fine because any settings that have
			// been entered into settings haven't been written to the DOM yet, so those will not be saved.
			// This does mean that the move up and down options will not respect the save button despite
			// everything else in the settings pane doing so.
			inst.q(".moveup").addEventListener("click", function(){
				const editing = inst.q(".settings").editing;

				// Find the next non-hidden sibling
				let sibling = editing;
				do {
					sibling = sibling.previousElementSibling;

					// Make sure that we don't move it past the top
					if (sibling == null || !sibling.classList.contains("task_entry"))
						return;
				} while (sibling.hidden);

				editing.parentNode.insertBefore(editing, sibling);
				_this.saveTasks(inst);
			});

			inst.q(".movedown").addEventListener("click", function(){
				const editing = inst.q(".settings").editing;

				// Find the next non-hidden sibling
				let sibling = editing;
				do {
					sibling = sibling.nextElementSibling;

					// Make sure that we don't move it past the bottom
					if (sibling == null || !sibling.classList.contains("task_entry")) {
						sibling = inst.q(".bottomAnchor");
					}
				} while (sibling.hidden);

				// Make sure we go after the last element, we don't to use after() here because of the bottomAnchor
				sibling = sibling.nextElementSibling;
				if (sibling == null || !sibling.classList.contains("task_entry"))
					sibling = inst.q(".bottomAnchor");

				editing.parentNode.insertBefore(editing, sibling);
				_this.saveTasks(inst);
			});

			// Add an event listener to the body handle settings interaction
			document.querySelector("body").addEventListener("keyup", function(e){
				if(inst.q(".settingsContainer").hidden)
					return;

				if (e.key == 'Escape') {
					_this.setSettingsHidden(inst, true);
				} else if (e.key === "Enter" && !e.shiftKey) {
					_this.saveSettings(inst);
				}
			});

			// Don't type an enter when hitting enter with no shift in the description
			// so that it bubbles and saves without having an enter character at the cursor
			inst.q(".settings").addEventListener("keypress", function(e){
				if (e.key === "Enter" && !e.shiftKey) {
					e.preventDefault();
				}
			});

			// Load tasks
			this.loadTasks(inst);

			// The current element being dragged
			inst.getInstanceRoot().dragSrcElem = null;
		};

		module.saveSettings = function(inst) {
			// Save element being edited
			const editing = inst.q(".settings").editing;
			const entries = editing.querySelector(".listEntryContainer");

			entries.textContent = "";
			const js = this.taskEntryToJSON(inst.q(".settings").querySelector(".listEntry"), true);

			this.refreshList(inst, js, entries, false);

			module.saveSettingsHook(inst, editing);

			// Save description
			const description = inst.q(".descriptionSetting").value;
			editing.querySelector(".description").textContent = description;

			// Check if the task was completed in editing mode
			this.applyFilters(inst, editing);

			// Hide settings
			this.setSettingsHidden(inst, true);

			// Save all tasks to localStorage
			this.saveTasks(inst);

			this.updateAlerts(inst);
		};

		module.setSettingsHidden = function(inst, value){
			inst.q(".settingsContainer").hidden = value;

			if (!value) {
				inst.q(".settingsContainer").querySelectorAll(".title")[0].focus();
			}
		};

		// Given the task container, convert it to a JSON object, need to pass in if we are in editing mode or not
		module.taskEntryToJSON = function(task, editing) {
			// Get values
			const checked = task.querySelector(".checkbox").checked;
			const children = task.querySelectorAll(":scope > .listEntry");

			let name;
			if (editing) {
				name = task.querySelector(".title").value;
			} else {
				name = task.querySelector(".title").textContent;
			}

			// Build children
			let JSONChildren;
			if (children.length > 0) {
				JSONChildren = [];
				for(let i=0; i<children.length; i++) {
					const newChild = this.taskEntryToJSON(children[i], editing);
					JSONChildren = JSONChildren.concat(newChild);
				}
			}

			// Build object
			const obj = [{"name": name, "checked": checked}];
			if (JSONChildren)
				obj[0].children = JSONChildren;

			return obj;
		};

		// Save the task to localStorage
		module.saveTasks = function(inst){
			const obj = [];
			const list = inst.q(".list");
			const tasks = list.querySelectorAll(".task_entry");
			for(let i=0; i<tasks.length; i++) {
				// Save the tasks
				const json = this.taskEntryToJSON(tasks[i].querySelector(".listEntryContainer > .listEntry"), false);

				// Save the description
				const description = tasks[i].querySelector(".description").textContent;

				// Save custom fields
				const customData = module.saveTasksHook(tasks[i]);
				const task = {"tasks": json, "description": description};
				Object.assign(task, customData);
				obj.push(task);
			}

			// Write to localstorage
			localStorage.setItem(module.saveName, JSON.stringify(obj));
		};

		// Load the tasks from localStorage
		module.loadTasks = function(inst){
			const saved = JSON.parse(localStorage.getItem(module.saveName));

			if (!saved)
				return;

			for(let i=0; i<saved.length; i++) {
				const customData = module.loadHook(saved[i]);
				if (customData) // This is to ensure that todo didn't purge this.
					this.newTask(inst, true, saved[i].tasks, customData, saved[i].description);
			}

			// We need to save in case loadHook modifies saved[i]
			this.saveTasks(inst);

			this.updateAlerts(inst);
		};

		// Get a value used to determine if a drag is valid via comparison.
		// There's no purpose in this containing a module or instance identifier since dragSrcElem is specific to this instance
		module.getDragToken = function(element) {
			// If we don't have an element, return a value that isn't equal to itself.
			if (element == null)
				return NaN;

			if (element.classList.contains("editable")) {
				return "edit";
			} else {
				return "list";
			}
		};

		// Add event listeners to element to make it draggable, used by both the settings modal and display list
		module.makeDraggable = function(inst, element) {
			const _this = this;
			element.draggable = true;
			const editMode = element.classList.contains("editable"); // If we're in the settings modal

			function removeDragClasses(e) {
				e.classList.remove("over-top");
				e.classList.remove("over-bottom");
				e.classList.remove("over-right");
			}

			// Don't let a drag start when dragging on the textbox
			const title = element.querySelector(".title");
			title.addEventListener("mousedown", function(){
				element.draggable = false;
			});
			title.addEventListener("mouseleave", function(){
				element.draggable = true;
			});

			// Begin drag
			element.addEventListener("dragstart", function(e){
				e.stopPropagation();
				inst.getInstanceRoot().dragSrcElem = this;
			});

			// Start drag over other
			element.addEventListener("dragover", function(e) {
				e.stopPropagation();
				e.preventDefault();

				// Abort the drag if it's to a different module or page
				const dragSource = inst.getInstanceRoot().dragSrcElem;

				if (module.getDragToken(this) !== module.getDragToken(dragSource)) {
					return;
				}

				// Element cannot be moved into itself or it's child
				if (dragSource == this || dragSource.contains(this)) {
					return;
				}

				// Don't let us drag the root element
				if (editMode && this.parentNode.classList.contains("listEntryContainer")) {
					return;
				}

				// Dragging on the top half vs the bottom half
				const rect = this.getBoundingClientRect();
				if (e.clientY < rect.top + this.offsetHeight * 0.5) {
					removeDragClasses(this);
					this.classList.add("over-top");
				} else {
					removeDragClasses(this);
					this.classList.add("over-bottom");
				}
				// If you drag on the right, add as a child instead of a sibling
				if (editMode && e.clientX > rect.left + this.offsetWidth * 0.5) {
					this.classList.add("over-right");
				}
			});

			// Stop drag over other
			element.addEventListener("dragleave", function() {
				removeDragClasses(this);
			});

			// Drag stops for any reason
			element.addEventListener("dragend", function() {
				// Null out dragSrcElem so we don't accidently drag the element later if we try drag something from another module
				inst.getInstanceRoot().dragSrcElem = null;
			});

			// End drag
			element.addEventListener("drop", function(e) {
				const dragSource = inst.getInstanceRoot().dragSrcElem;
				inst.getInstanceRoot().dragSrcElem = null; // Null out dragSrcElem so we don't accidently drag the element later if try we drag something from another module

				// Abort the drag if you're trying to drag from the settings page outside of it or vice versa or to a different module
				if (module.getDragToken(this) !== module.getDragToken(dragSource)) {
					removeDragClasses(this);
					return;
				}

				if (dragSource !== this) {
					// Parent cannot be moved into itself
					if (dragSource.contains(this)) {
						return;
					}

					// Don't let us drag the root element
					if (editMode && this.parentNode.classList.contains("listEntryContainer")) {
						return;
					}

					e.stopPropagation();

					// Drop on right or left
					if (this.classList.contains("over-right")) {
						// Drop above or below
						if (this.classList.contains("over-top")){
							this.appendChild(dragSource);
						} else {
							this.appendChild(dragSource);
						}
					} else {
						// Drop above or below
						if (this.classList.contains("over-top")){
							this.parentNode.insertBefore(dragSource, this);
						} else {
							this.parentNode.insertBefore(dragSource, this.nextElementSibling);
						}
					}
				}
				removeDragClasses(this);
				if (!editMode) {
					_this.saveTasks(inst);
				}
			});
		};

		module.refreshList = function(inst, taskList, parent, editing){
			for(let i=0; i<taskList.length; i++) {
				const entry = gimme("div").class("listEntry").build();
				if (editing) {
					gimme("span").textContent("=").class("drag-handle").appendTo(entry);
				}

				const checkbox = gimme("input").type("checkbox").value(taskList[i].checked).class("checkbox").appendTo(entry);

				const _this = this;

				if (!editing) {
					checkbox.addEventListener("change", function(){
						// Rehide all the completed tasks
						_this.applyFilters(inst, checkbox);

						// Save
						_this.saveTasks(inst);

						_this.updateAlerts(inst);
					});
				}

				let name;
				if (editing) {
					name = gimme("input").type("text").value(taskList[i].name);
				} else {
					name = gimme("span").textContent(taskList[i].name);
				}
				name = name.class("title").appendTo(entry);

				if (editing) {
					name.addEventListener("keydown",function(e){
						// Allow navigation with ctrl+up/down
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
					// Add marker that this is an editing listEntry
					entry.classList.add("editable");

					// Don't make root node draggable
					if (!parent.classList.contains("listEntryContainer")) {
						this.makeDraggable(inst, entry);
					}

					const addButton = gimme("input").type("button").value("+").class("spaced").build();
					const _this = this;
					addButton.addEventListener("click", function(){
						const defTask = [{"name":getSetting(_this.name, "defaultName"), "checked":false}];
						_this.refreshList(inst, defTask, this.parentNode, editing);
					});
					entry.appendChild(addButton);

					const removeButton = gimme("input").type("button").value("X").class("spaced").build();

					removeButton.addEventListener("click", function(){
						// Delete the entry or the whole task if it's the root task
						if (parent.classList.contains("listEntry")) {
							this.parentNode.remove();
						} else {
							_this.deleteEditing(inst);
						}
					});

					entry.appendChild(removeButton);
				}

				// Iterate the children
				if (taskList[i].children) {
					this.refreshList(inst, taskList[i].children, entry, editing);
				}

				parent.appendChild(entry);
			}
		};

		module.newTask = function(inst, append, JSONTasks, customData, description){
			const _this = this;

			const fragment = cloneTemplate(inst.q(".task_tmplt"));
			const element = fragment.children[0];

			module.newHook(inst, customData, element);

			// Set the description
			if (description)
				element.querySelector(".description").textContent = description;

			// Set default task
			let tasks;
			if (JSONTasks) {
				tasks = JSONTasks;
			} else {
				tasks = [{"name":getSetting(_this.name, "defaultName"), "checked":false}];
			}
			this.refreshList(inst, tasks, element.querySelector(".listEntryContainer"), false);

			// Setup settings trigger
			element.addEventListener("click", function(e){
				const classList = e.target.classList;
				if (!classList.contains("checkbox"))
					_this.editTask(inst, element);
			});

			this.makeDraggable(inst, element);

			// Put at the top or bottom of the list depending on append
			const firstTask = inst.qAll(".task_entry")[0];
			if (append || !firstTask) {
				inst.q(".list").insertBefore(fragment, inst.q(".bottomAnchor"));
			} else {
				inst.q(".list").insertBefore(fragment, firstTask);
			}
		};

		module.editTask = function(inst, task){
			// Remember what's being edited
			inst.q(".settings").editing = task;

			// Copy task to settings
			const json = this.taskEntryToJSON(task.querySelector(".listEntry"), false);
			const taskEditingElement = inst.q(".settings").querySelector(".listEntryContainer");
			taskEditingElement.textContent = "";
			this.refreshList(inst, json, taskEditingElement, true);

			// Copy common values to settings
			inst.q(".descriptionSetting").value = task.querySelector(".description").textContent;

			module.editHook(inst, task);

			// Open modal
			this.setSettingsHidden(inst, false);
		};

		module.deleteEditing = function(inst){
			const shouldContinue = db_confirm("Are you sure that you would like to delete this task?");

			if (!shouldContinue)
				return;

			inst.q(".settings").editing.remove();
			this.setSettingsHidden(inst, true);
			this.saveTasks(inst);
			this.updateAlerts(inst);
		};

		module.checklist_instantiate = function(where){
			setInnerHTML(where, /*html*/`
				<div class="fs30b">${module.displayName}</div>
				<div class="settingsContainer" hidden>
					<div class="settings">
						<input type="button" class="saveSetting" value="Save"/>
						<input type="button" class="cancelSetting" value="Cancel"/>
						<input type="button" class="deleteSetting" value="Delete"/>
						<br/>
						<input type="button" class="moveup" value="Move up"/>
						<input type="button" class="movedown" value="Move down"/>
						<br/><br/>
						<div class="listEntryContainer"></div>
						<br/>
						<textarea class="descriptionSetting" placeholder="Description"></textarea>
						<br/><br/>
						${module.getCustomSettings()}
					</div>
					<div class="backgroundFade"></div>
				</div>
				<input type="button" class="insertButton" value="+" \>
				${module.getCustomFilters()}
				<br/>
				<div class="list">
					<template class="task_tmplt">
						<div class="task_entry">
							<div class="listEntryContainer"></div>
							<div class="description"></div>
							${module.getCustomValues()}
						</div>
					</template>
					<input type="hidden" class="bottomAnchor"/>
				</div>
			`);
		};

		module.checklist_getStyle = function(append){
			return /*css*/`
				.checklist .settings {
					z-index: 9;
					background-color: var(--lw-black);

					position: fixed;
					top: 50%;
					left: 50%;
					transform: translate(-50%, -50%);

					padding: 10px;
					overflow: auto;
					max-height: 90vh;
					max-width: 90vw;
				}

				.checklist .backgroundFade {
					z-index: 8;
					left: 0;
					top: 0;
					position: fixed;
					width: 100vw;
					height: 100vh;
					background-color: var(--lw-black);
					opacity: 80%;
				}

				.checklist .insertButton {
					width: 40px;
					height: 40px;
					font-size: 30px;
					line-height: 30px;
					margin-top: 10px;
					margin-bottom: 10px;
				}

				.checklist :not(.listEntryContainer) > .listEntry{
					margin-left: 10px;
				}

				.checklist .task_entry {
					margin-bottom: 3px;
					background-color: #202020;
					cursor: pointer;
				}

				.checklist .descriptionSetting {
					height: 4ch;
				}

				.checklist .description {
					font-size: 12px;
					margin: 4px;
				}

				.checklist .spaced {
					margin-top: 4px;
					margin-left: 4px;
				}

				.checklist label {
					padding-left: 3px;
				}

				.checklist .task_entry {
					box-sizing: border-box;
					padding: 2px;
				}

				.checklist .over-top {
					border-top: 2px solid grey;
					padding-top: 0px;
				}

				.checklist .over-bottom {
					border-bottom: 2px solid grey;
					padding-bottom: 0px;
				}

				.checklist .drag-handle {
					user-select: none;
					cursor: grab;
				}

				${append}
			`;
		};
	},
});
