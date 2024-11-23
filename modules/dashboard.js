'use strict';
const dashboard = {
	modules: [],
	includes: [],

	//registers a module object
	//dashboard.registerModule(module)
	registerModule: function(module){
		//error checking
		if (!module.name){
			error("Module must have a name.");
			return;
		}

		if (this.modules[module.name]){
			error("Module " + module.name + " already exists.");
			return;
		}

		if (!module.version){
			error("Module " + module.name + " must have a version.");
			return;
		}

		//save the module
		this.modules[module.name] = module;

		log("Registered module: " + module.name);
	},

	//dashboard.registerInclude(include)
	registerInclude: function(include) {
		if (!include.name) {
			error("Include must have a name.");
			return;
		}

		if (this.modules[include.name]){
			error("Include " + include.name + " already exists.");
			return;
		}

		//save the include
		this.includes[include.name] = include;

		log("Registered include: " + include.name);
	},

	//dashboard.togglePane(toPane)
	togglePane: function(toPane){
		const panes = {
			settings: {pane: document.querySelector("#settingsPane"), funcs: dashboard.settings},
			layout: {pane: document.querySelector("#layout")},
			documentation: {pane: document.querySelector("#documentationPane"), funcs: dashboard.documentation}
		};

		//get current pane
		let currentPane;
		for(let p in panes){
			if (!panes[p].pane.hidden)
				currentPane = p;
		}

		if (panes[currentPane].funcs?.checkLeave && !panes[currentPane].funcs.checkLeave()){
			return;
		}

		//scroll to top of new pane
		scrollTo(0,0);

		//handle toggle
		if (!panes[toPane].pane.hidden){
			toPane = "layout";
		}

		//hide all panes
		for(let p in panes){
			panes[p].pane.hidden = true;
		}

		//unhide appropriate pane
		panes[toPane].funcs?.createPane();
		panes[toPane].pane.hidden = false;
	},

	//dashboard.makeExport()
	makeExport: function(){
		const obj = {"storage" : {},"jsonFields" : []};
		for(let i = 0, key = localStorage.key(i); i < localStorage.length; i++, key=localStorage.key(i)){
			let value = localStorage.getItem(key);

			try {
				value = JSON.parse(value);
				//save that it's a json object
				obj.jsonFields.push(key);
			} catch (e){}

			obj.storage[key] = value;
		}

		const seperator = getSetting("dashboard", "exportPrettified") ? "\t" : "";
		const string = JSON.stringify(obj, null, seperator) + "\n";

		//download the file

		const date = new Date();
		let dateStr = date.getFullYear();
		dateStr += "-" + ((date.getMonth()+1) + "").padStart(2,0);
		dateStr += "-" + ((date.getDate() + "").padStart(2,0));

		const ref = 'data:text/plain;charset=utf-8,' + encodeURIComponent(string);
		const downloadAnchor = gimme("a").href(ref).build();
		downloadAnchor.setAttribute("download","lwutilExport-" + dateStr + ".json");
		downloadAnchor.style.display = "none";
		document.body.appendChild(downloadAnchor);
		downloadAnchor.click();
		document.body.removeChild(downloadAnchor);
	},

	//dashboard.setSingleLayout(moduleName)
	setSingleLayout(moduleName){
		const layout = "[[{\"name\": \"" + moduleName + "\"}]]";
		dashboard.layout.reload(layout);
	},

	//dashboard.pageLoad()
	pageLoad: function(){
		document.querySelector("#settingsToggle").addEventListener("click", function(){
			dashboard.togglePane("settings");
		});
		document.querySelector("#documentationToggle").addEventListener("click", function(){
			dashboard.togglePane("documentation");
		});
		document.querySelector("#export").addEventListener("click",function(){
			dashboard.makeExport();
		});

		document.querySelector("#importFile").addEventListener("change", function(){
			const file = document.querySelector("#importFile").files[0];

			if (!file)
				return;

			const doRead = db_confirm("Importing data will wipe all currently saved data. Would you like to continue?");
			if (!doRead)
				return;

			//reset localStorage
			localStorage.clear();

			//load new data
			const fileReader = new FileReader();
			fileReader.readAsText(file);
			fileReader.addEventListener("load", function() {
				const file = JSON.parse(fileReader.result);
				const storage = file.storage;
				const jsonFields = file.jsonFields;

				for(let k in storage){
					let data = storage[k];
					if (jsonFields.includes(k))
						data = JSON.stringify(data);

					localStorage.setItem(k, data);
				}

				dashboard.layout.reload();

				document.querySelector("#importFile").value = "";
			});
		});
		document.querySelector("#saveSettings").addEventListener("click", function(){
			dashboard.settings.saveSettings();
		});

		document.querySelector("#importFile").value = "";

		//handle updates
		for(let name in dashboard.modules) {
			dashboard.layout.updateModule(name);
		}

		dashboard.layout.create();

		//init layout dropdown
		const layouts = document.querySelector("#layoutDropdown");
		layouts.addEventListener("input", function(){
			//don't set layout if we want to load from settings
			if (this.value != "default") {
				dashboard.setSingleLayout(this.value);
			} else {
				dashboard.layout.reload();
			}
		});

		for(let moduleName in dashboard.modules){
			if (moduleName === "dashboard")
				continue;

			const module = dashboard.modules[moduleName];

			//add to layout dropdown
			elementEditor(layouts).option(module.name, module.displayName);
		}

		if (dashboard.tests.enabled) {
			//load scripts
			for(let moduleName in dashboard.modules){
				dashboard.tests.loadTests(moduleName, Object.keys(dashboard.modules).length);
			}
		}
	},

	//dashboard.layout
	layout: {
		firstLoad: false,
		exportWarning: false,

		// used to uniquely identify an instance, should only be necessary for label elements
		nextInstanceId: 0,

		//dashboard.layout.reload(overrideConfig)
		reload: function(overrideConfig){
			dashboard.layout.delete();
			dashboard.layout.create(overrideConfig);
		},

		//dashboard.layout.delete()
		delete: function(){
			for (let m in dashboard.modules){
				if (!dashboard.modules[m].instances)
					continue;

				if (dashboard.modules[m].deconstructInstance) {
					for(let i=0; i<dashboard.modules[m].instances.length; i++){
						dashboard.modules[m].deconstructInstance(dashboard.modules[m].instances[i]);
					}
				}
				dashboard.modules[m].instances = null;
			}
			document.querySelector("#layout").textContent = "";
		},

		//dashboard.layout.appendNewContainer(location)
		//create a new instance in the DOM
		appendNewContainer: function(location){
			const c = gimme("div").class("container").appendTo(location);
			return c;
		},

		//dashboard.layout.appendInstanceToContainer(container)
		//add a module to a container
		appendInstanceToContainer: function(container){
			const m = gimme("div").class("instance").appendTo(container);
			return m;
		},

		//dashboard.layout.updateSaveCurrentVersion(name)
		//saves a modules current version to the lastVersion database if applicable
		updateSaveCurrentVersion(name, versions){
			if (!dashboard.modules[name].updates)
				return;

			//create the versions object if it doesn't exist
			if (!versions) {
				versions = {};
			}
			versions[name] = dashboard.modules[name].version;
			localStorage.setItem("db_versions", JSON.stringify(versions));
		},

		//dashboard.layout.updateModule(name)
		//apply any applicable update functions for a given module
		//There's a few cases that this function needs to handle
		//	0. No save data yet
		//		This case should not run any update functions
		//	1. Pre-version numbers, detected by checking if lastVersion and db_versions don't exist with saved data
		//		This should run all of the update functions for every module
		//	2. Global version number, detected by checking if lastVersion exists
		//		This should run all update functions newer than lastVersion
		//	3. Local version numbers, detected by checking if db_versions
		//		This should run all update functions for modules whose db_version number is < it's current version
		//		It should also run update functions if the module does not have any saved version number and they exist
		updateModule: function(name){
			let versionsStr = localStorage.getItem("db_versions");
			let versions = null;
			if (versionsStr) {
				versions = JSON.parse(versionsStr);
			}

			//don't run update functions the first time loading the page.
			if (localStorage.length == 0 || dashboard.layout.firstLoad) {
				//save this result for later modules
				dashboard.layout.firstLoad = true;

				dashboard.layout.updateSaveCurrentVersion(name, versions);
				return;
			}

			let lastVersion;
			if (versions) {
				lastVersion = versions[name];
			} else {
				//the only way to get here is to be updating from a version before individual module versions.
				// So use the old version, this will cause the dashboard update function to run and update the versions.
				lastVersion = localStorage.getItem("lastVersion");
			}

			//if lastVersion is undefined, that means a module previously didn't have an update function
			const currentVersion = dashboard.modules[name].version;
			//if the version has increased, or loading save from before update functions existed/had a saved version
			if (currentVersion > lastVersion || (!lastVersion && localStorage.length > 0)){
				const updateFunc = dashboard.modules[name].updates;
				if (updateFunc){
					const updates = updateFunc();
					for(let i=0; i<updates.length; i++){
						//if the update function is needed for this update
						if (!lastVersion || (lastVersion <= updates[i].ver && updates[i].ver < currentVersion)){
							if (!dashboard.layout.exportWarning) {
								dashboard.layout.exportWarning = true;
								const shouldExport = db_confirm("The save format of some modules have been changed and are about to be updated, would you like to make an export of your data first? (highly recommended)");
								if (shouldExport) {
									dashboard.makeExport();
								}
							}
							updates[i].func();
						}
					}
				}
			}

			//need to reload versions in case an update function changed it
			versionsStr = localStorage.getItem("db_versions");
			versions = null;
			if (versionsStr) {
				versions = JSON.parse(versionsStr);
			}
			dashboard.layout.updateSaveCurrentVersion(name, versions);
		},

		//dashboard.layout.getContainerSettings()
		//	returns an array of all of the settings that can be applied to containers
		getContainerSettings: function(){
			return [
				{
					displayName: "Max Height",
					name: "maxHeight",
					validationString: "\\d{1,}(px|%)",
					apply: function (container, value) {
						container.style.maxHeight = value;
					},
				},
			]
		},

		//dashboard.layout.getModuleSettings()
		//	returns an array of all of the settings that can be applied to modules
		getModuleSettings: function(){
			return [
				{
					displayName: "Width",
					name: "width",
					validationString: "\\d{1,}(px|%)",
					apply: function (module, value) {
						module.style.maxWidth = value;
					}
				},
			];
		},

		//dashboard.layout.getSettings()
		//	returns an array of all settings that can be applied to containers and modules
		getSettings(){
			let cSettings = dashboard.layout.getContainerSettings();
			cSettings.forEach(setting => {
				setting.type = "container";
			});

			let mSettings = dashboard.layout.getModuleSettings();
			mSettings.forEach(setting => {
				setting.type = "module";
			});

			return cSettings.concat(mSettings);
		},

		//dashboard.layout.create(overrideConfig)
		create: function(overrideConfig){
			log("Creating layout");

			//load the config
			let config;
			if (!overrideConfig) {
				config = getSetting("dashboard", "config");
			} else {
				config = overrideConfig;
			}

			try {
				config = JSON.parse(config);
			} catch(e) {
				error(e);
				db_alert("Invalid config loaded, please go to the settings, turn on the default, and reload.");
				return;
			}

			//search for override modules
			for (let m in dashboard.modules){
				if (!dashboard.modules[m].overrideLayout)
					continue;

				try {
					dashboard.modules[m].init();
				} catch (e) {
					error(e);
					error("Error running init for " + m + "\n", e);
				}
			}

			//create containers
			dashboard.layout.nextInstanceId = 0;
			for(let cPos = 0; cPos<config.length; cPos++){
				const container = this.appendNewContainer(document.querySelector("#layout"));

				//create instances
				for(let mPos = 0; mPos<config[cPos].length; mPos++){
					const mConfig = config[cPos][mPos];

					//apply container settings
					const cSettings = dashboard.layout.getContainerSettings();
					const setting = cSettings.find(setting => setting.name === mConfig.name);
					if (setting) {
						setting.apply(container, mConfig.value);
						continue;
					}

					if (!dashboard.modules[mConfig.name]) {
						error("Failed to load module from config: " + mConfig.name);
						continue;
					}

					const instRoot = this.appendInstanceToContainer(container);
					instRoot.classList.add(mConfig.name);

					//apply instance settings
					let mSettings = dashboard.layout.getModuleSettings();
					for(const mSetting of mSettings) {
						if (mConfig[mSetting.name]) {
							mSetting.apply(instRoot, mConfig[mSetting.name]);
						}
					}

					//handle updates
					dashboard.layout.updateModule(mConfig.name);

					//process module includes
					const mObj = dashboard.modules[mConfig.name];
					if (mObj.include) {
						for(let inc=0; inc<mObj.include.length; inc++) {
							const include = dashboard.includes[mObj.include[inc]];
							if (!include) {
								error(mObj.name + ", " + mObj.include[inc] + " - include not found.");
								continue;
							}
							include.apply(mObj);
						}
					}

					//call instantiate for the instance
					const instFunc = dashboard.modules[mConfig.name].instantiate;
					if (instFunc){
						try {
							instFunc(instRoot);
						} catch (e) {
							error("Error running instantiate for " + mConfig.name + "\n", e);
						}
					}

					//create the instance
					const instanceId = dashboard.layout.nextInstanceId;
					dashboard.layout.nextInstanceId++;

					const instance = {
						//queries for a single element that matches selector
						q: function(selector){
							if (selector.includes("#")){
								log(mConfig.name + " is using an id q, this is not recommended.");
							}
							const results = instRoot.querySelectorAll(selector);
							if (results.length > 1){
								error("q(\"" + selector+ "\") found multiple results. Did you mean to use qAll()?");
							}

							//return a result if any are found
							if (results)
								return results[0];
							return null;
						},

						//queries for all elements that match a selector
						qAll: function(selector){
							if (selector.includes("#")){
								log(mConfig.name + " is using an id qAll, this is really not recommended.");
							}
							return instRoot.querySelectorAll(selector);
						},

						//returns the root DOM node for this instance
						getInstanceRoot: function(){
							return instRoot;
						},

						//The ID is a temporary unique identifier for this instance, and should not be used for saving
						getId: function(){
							return instanceId;
						},
					};

					const imodule = dashboard.modules[mConfig.name];
					//save the instance on the module
					if (!imodule.instances)
						imodule.instances = [];
					imodule.instances.push(instance);

					//call the init function on the instance
					if (imodule.init){
						try {
							imodule.init(instance);
						} catch (e) {
							error(e);
							error("Error running init for " + mConfig.name + "\n", e);
						}
					}
				}
			}
			dashboard.layout.firstLoad = false;
		},
	},
	//dashboard.documentation
	documentation: {
		//dashboard.documentation.createPane()
		createPane: function(){
			document.querySelector("#docs").textContent = "";
			document.querySelector("#docIndex").innerHTML = /*html*/`<span class="fs30b">Index</span>`;

			for(let moduleName in dashboard.modules){
				dashboard.documentation.createDocumentationInstance(moduleName);
			}
		},

		//dashboard.documentation.createDocumentationInstance(name)
		createDocumentationInstance: function(name){
			const module = dashboard.modules[name];
			const mDocsFunc = module.registerDocumentation;
			if (!mDocsFunc)
				return;

			let mDocs;
			try {
				mDocs = mDocsFunc();
			} catch (e) {
				error("Error running registerDocumentation for " + name + "\n", e);
				return;
			}

			//if the module has a docs function, we create a documentation instance for it
			const container = dashboard.layout.appendNewContainer(document.querySelector("#docs"));
			const element = dashboard.layout.appendInstanceToContainer(container);

			//add the element to the index
			const entry = gimme("li").build();
			const anchor = gimme("a").href("").textContent(module.displayName).build();
			anchor.addEventListener("click", function(e){
				e.preventDefault();
				document.querySelector("#" + module.name).scrollIntoView();
			});
			entry.appendChild(anchor);
			document.querySelector("#docIndex").appendChild(entry);

			//add the header element
			const displayName = module.displayName;
			gimme("div").textContent(displayName ? displayName : name).class("fs30b").id(module.name).appendTo(element);

			//create p elements for every mDoc[i]
			for(let i=0; i<mDocs.length; i++){
				gimme("p").textContent(mDocs[i]).appendTo(element);
			}
		},
	},

	//dashboard.settings
	settings: {
		//dashboard.settings.createPane()
		createPane: function(){
			document.querySelector("#settings").textContent = "";

			for(let moduleName in dashboard.modules){
				dashboard.settings.createInstance(moduleName);
			}
		},

		//dashboard.settings.checkLeave()
		checkLeave: function(){
			let discard = true;
			if (!document.querySelector("#settingsPane").hidden){
				const unsavedSettings = JSON.stringify(dashboard.settings.getNewSettings());
				const savedSettings = localStorage.getItem("settings");

				//if the user has unsaved settings
				if (savedSettings != unsavedSettings){
					discard = db_confirm("You have unsaved settings, would you like to discard them?");
				}
			}
			return discard;
		},

		//dashboard.settings.getNewSettings()
		getNewSettings: function(){
			const settings = document.querySelectorAll(".settingInput");
			const newSettings = {};
			for(let i=0; i<settings.length; i++){
				//skip if defaulting
				if(document.querySelector("#default_" + settings[i].id).checked)
					continue;

				let value;
				switch(settings[i].dataType){
					case "bool":
						value = settings[i].checked;
						break;
					case "text":
						value = settings[i].value;
						break;
					case "number":
						value = parseInt(settings[i].value);
						if (!value) value = 0;
					case "custom":
						value = settings[i].value;
						break;
				}

				if (newSettings[settings[i].module] == null)
					newSettings[settings[i].module] = {};

				newSettings[settings[i].module][settings[i].name] = value;
			}

			return newSettings;
		},

		//dashboard.settings.saveSettings()
		saveSettings: function(){
			const newSettings = dashboard.settings.getNewSettings();
			localStorage.setItem("settings", JSON.stringify(newSettings));
		},

		//dashboard.settings.createInstance(name)
		createInstance: function(moduleName){
			const module = dashboard.modules[moduleName];
			const mSettingsFunc = module.registerSettings;
			if (!mSettingsFunc)
				return;

			let mSettings;
			try {
				mSettings = mSettingsFunc();
			} catch (e) {
				error("Error running registerSettings for " + moduleName + "\n", e);
				return;
			}

			//if the module has a settings function, we create an instance for it
			const container = dashboard.layout.appendNewContainer(document.querySelector("#settingsPane"));
			const element = dashboard.layout.appendInstanceToContainer(container);

			const displayName = dashboard.modules[moduleName].displayName;
			gimme("div").textContent(displayName ? displayName : moduleName).class("fs30b").appendTo(element);

			//go through the settings and create the entries for them
			for(let i=0; i<mSettings.length; i++){
				const tempId = moduleName + "_" + mSettings[i].name;

				//default checkbox
				const checked = getSettingFromStorage(moduleName, mSettings[i].name) == null;
				const id = "default_" + moduleName + "_" + mSettings[i].name;
				const defaultInput = gimme("input").type("checkbox").value(checked).id(id).build();
				defaultInput.managing = tempId;
				element.appendChild(defaultInput);
				defaultInput.addEventListener("change", function(){
					document.querySelector("#" + this.managing).disabled = this.checked;
				});

				//append input
				let input = gimme("input");
				const value = getSetting(moduleName, mSettings[i].name);

				switch(mSettings[i].type){
					case "bool":
						input = input.type("checkbox").value(value ? true : false);
						break;
					case "text":
						input = input.type("text").value(value);
						break;
					case "number":
						input = input.type("number").value(value);
						break;
					case "custom":
						input = input.type("hidden").value(value);
						break;
				}

				//disable if defaulted
				if (document.querySelector("#default_"+tempId).checked) {
					input.disabled = true;
				}
				input = input.id(tempId).class("settingInput").build();


				//tell the element what it is
				input.dataType = mSettings[i].type;
				input.name = mSettings[i].name;
				input.module = moduleName;

				element.appendChild(input);
				if (mSettings[i].type === "custom") {
					//call custom type
					element.appendChild(input);
					let span = gimme("span").build();
					mSettings[i].customDefinition(span);
					element.appendChild(span);
				} else {
					//setup label and input ID
					gimme("label").for(input.id).textContent(mSettings[i].description).appendTo(element);
				}

				//append line break
				gimme("br").appendTo(element);
			}

			document.querySelector("#settings").appendChild(element);
		},

	},

	//dashboard.tests
	tests: {
		//set this to true to run the tests on page load
		//dashboard.tests.enabled
		enabled: false,
		//dashboard.tests.testers
		testers: {},
		//dashboard.tests.loadedTests
		loadedTests: 0,
		//dashboard.test.overrideSettings
		overrideSettings: {},

		//dashboard.tests.loadTests(moduleName, testCount)
		loadTests: function(moduleName, testCount) {
			const _this = this;
			const script = gimme("script").build();
			script.src = "test/" + moduleName + "_tests.js";
			script.addEventListener("error", function(){
				_this.loadedTests++;
				if (_this.loadedTests == testCount) {
					dashboard.tests.runTests();
				}
			});
			script.addEventListener("load", function(){
				_this.loadedTests++;
				if (_this.loadedTests == testCount) {
					dashboard.tests.runTests();
				}
			});
			document.body.appendChild(script);
			script.remove();
		},

		//dashboard.test.registerTester(tests)
		registerTester: function(name, tests){
			dashboard.tests.testers[name] = tests;
		},

		//dashboard.test.runTests
		runTests(){
			const output = [];
			for(let name in dashboard.tests.testers){
				dashboard.setSingleLayout(name);
				const fails = [];

				const tests = this.testers[name];
				let passCount = 0;
				for(let i=0; i<tests.length; i++) {
					const module = dashboard.modules[name];
					const instance = module.instances[0];
					let result;
					try {
						result = tests[i].test(instance, module);
					} catch (e) {
						error(e);
						result = false;
					}
					if (result) {
						passCount++;
					} else {
						error(name + ": Failed " + tests[i].name);
						fails.push(tests[i].name);
					}
				}
				output.push({name: name, passCount: passCount, testCount: tests.length});

				if (fails.length > 0) {
					output[output.length-1].fails = fails;
				}
			}

			//go back to the user defined layout
			dashboard.layout.reload();

			//log the results
			log(output);
		},

		//dashboard.tests.click(element)
		//Send a synchronous click event to element
		click: function(element) {
			element.dispatchEvent(new MouseEvent("click", { detail: 1, bubbles: true}));
		},

		//dashboard.test.forceSetting
		//Sets a setting to a specific value for testing
		//If a test is influenced by a setting, it should use this at the begining of the test
		forceSetting: function(moduleName, setting, newValue) {
			if (!settingExists(moduleName, setting)) {
				error("Invalid setting being set as override.");
				return;
			}
			if (!dashboard.tests.overrideSettings[moduleName])
				dashboard.tests.overrideSettings[moduleName] = {};

			dashboard.tests.overrideSettings[moduleName][setting] = newValue;
		}
	}
}

//register the dashboard as a hidden module to allow for utility functions to be called.
dashboard.registerModule({
	name: "dashboard",
	displayName: "Dashboard",
	version: "1.1.1",
	overrideLayout: true,

	registerSettings: function(){
		return [
			{
				"name": "displayFooterText",
				"description": "Display footer text",
				"type": "bool",
				"default": true,
			},
			{
				"name": "exportPrettified",
				"description": "Export prettified file",
				"type": "bool",
				"default": true,
			},
			{
				"name": "config",
				"description": "Config editor object",
				"type": "custom",
				"customDefinition": function (parent) {
					function loadLayout() {
						function changeSelection(newSelection) {
							//update selection variables/classes
							if (newSelection) {
								if (newSelection.classList.contains("selected")) {
									newSelection.classList.remove("selected");
									dialog.selection = null;
								} else {
									if (dialog.selection)
										dialog.selection.classList.remove("selected");
									dialog.selection = newSelection;
									newSelection.classList.add("selected");
								}
							}

							//update display of selection
							if (dialog.selection) {
								let type;
								if (dialog.selection.classList.contains("row")) {

									type = "container";
									dialog.querySelector(".rowEdit").hidden = false;
									dialog.querySelector(".instEdit").hidden = true;
								} else if (dialog.selection.classList.contains("config_instance")) {
									type = "module";
									dialog.querySelector(".rowEdit").hidden = true;
									dialog.querySelector(".instEdit").hidden = false;

									filterModuleSelections();

									//instances -> settings
									const selection = dialog.selection.querySelector(".config_module_name").value;
									dialog.querySelector(".moduleSelect").value = selection;
								}

								for(const setting of dashboard.layout.getSettings()) {
									if (setting.type !== type) {
										continue;
									}

									//update settings values
									const element = dialog.querySelector("." + setting.name + "Setting");
									element.value = dialog.selection.querySelector("." + setting.name).textContent;

									//update settings validations
									procValidation(element, setting);
								}
							} else {
								dialog.querySelector(".rowEdit").hidden = true;
								dialog.querySelector(".instEdit").hidden = true;
							}
						}

						function createRow() {
							const rowFrag = dialog.querySelector(".row_tmplt").content.cloneNode(true);

							const row = rowFrag.children[0];
							dialog.querySelector(".editableTable").appendChild(rowFrag);

							row.addEventListener("click", function() {
								changeSelection(this);
							});

							return row;
						}

						function createInstance(row) {
							const instFrag = dialog.querySelector(".inst_tmplt").content.cloneNode(true);
							const inst = instFrag.children[0];

							row.appendChild(instFrag);
							inst.addEventListener("click", function(e) {
								e.stopPropagation();
								changeSelection(this);
							});

							return inst;
						}

						//filter out modules that are already on the config
						function filterModuleSelections() {
							const configModules = dialog.querySelectorAll(".config_module_name");
							const selections = [];
							for (let i=0; i<configModules.length; i++) {
								selections.push(configModules[i].value);
							}

							const modules = dialog.querySelectorAll(".moduleSelect > option");
							for (let i=0; i<modules.length; i++) {
								modules[i].hidden = selections.includes(modules[i].value);
							}
						}

						function loadConfig(config) {
							let cSettings = dashboard.layout.getContainerSettings();
							let mSettings = dashboard.layout.getModuleSettings();
							for (let rows = 0; rows < config.length; rows++) {
								const row = createRow();
								for (let instances = 0; instances < config[rows].length; instances++) {
									const moduleName = config[rows][instances].name;
									if (moduleName) {
										//check if row is actually a setting
										const setting = cSettings.find(setting => setting.name === moduleName);
										if (setting) {
											row.querySelector("." + moduleName).textContent = config[rows][instances].value;
											row.querySelector("." + moduleName + "Display").hidden = false;
											row.querySelector("." + moduleName).hidden = false;
											continue;
										}

										const inst = createInstance(row);

										for(let mSetting of mSettings) {
											//process instance settings
											const value = config[rows][instances][mSetting.name];
											if (value) {
												inst.querySelector("." + mSetting.name).textContent = value;
												inst.querySelector("." + mSetting.name + "Display").hidden = false;
												inst.querySelector("." + mSetting.name).hidden = false;
											}
										}

										inst.querySelector(".config_module").textContent = dashboard.modules[moduleName].displayName;
										inst.querySelector(".config_module_name").value = moduleName;
									}
								}
							}
						}

						function getGuiString() {
							const newConfig = [];

							const rows = document.querySelectorAll(".row");
							let mSettings = dashboard.layout.getModuleSettings();
							for (let i = 0; i < rows.length; i++) {
								const instances = rows[i].querySelectorAll(".config_instance");
								if (instances.length > 0) { //only add a row if there's really an instance in it
									const row = [];
									for(const setting of dashboard.layout.getContainerSettings()) {
										const value = rows[i].querySelector("." + setting.name).textContent;
										if (value) {
											row.push(
												{
													name: setting.name,
													value: value,
												}
											);
										}
									}

									for (let o = 0; o < instances.length; o++) {
										const inst = {
											name: instances[o].querySelector(".config_module_name").value,
										}

										for(const setting of mSettings) {
											const value = instances[o].querySelector("." + setting.name).textContent;
											if (value) {
												inst[setting.name] = value;
											}
										}

										row.push(inst);
									}

									newConfig.push(row);
								}
							}
							return JSON.stringify(newConfig);
						}

						function procValidation(input, setting) {
							if (input.validity.patternMismatch) {
								input.style.border = "2px dashed red";
								return;
							} else {
								input.style.border = "";
							}

							if (input.value === "") {
								dialog.selection.querySelector("." + setting.name + "Display").hidden = true;
							} else {
								dialog.selection.querySelector("." + setting.name + "Display").hidden = false;
							}
							dialog.selection.querySelector("." + setting.name).textContent = input.value;
						}

						dialog.selection = null;
						setInnerHTML(dialog, /*html*/`
							<div class="guiEditor">
								<table class="editableTable"></table>
								<div class="rowEdit" hidden=true>
									<input type="button" class="rowAddCell" value="Add cell"><br/>
									<input type="button" class="rowAdd" value="Add row"><br/>
									<input type="button" class="rowDelete" value="Delete row">
								</div>
								<div class="instEdit" hidden=true>
									<br/>
									<span>Module: </span><select class="moduleSelect"></select><br/>
									<input type="button" class="cellDelete" value="Delete cell">
								</div>
								<br/>
								<template class="row_tmplt">
									<tr class="row">
										<td class="rowHeader">
											<span>Row</span>
										</td>
									</tr>
								</template>
								<template class="inst_tmplt">
									<td class="config_instance">
										<input type="hidden" class="config_module_name"></span>
										<span class="config_module"></span>
									</td>
								</template>
							</div>
							<div class="textEditor" hidden=true>
								<textarea class="textareaEditor"></textarea>
							</div>
							<input type="button" class="toggleEditMode" value="Toggle edit mode" ><br/>
							<input type="button" class="apply" value="Apply" />
							<input type="button" class="cancel" value="Cancel" />
						`);

						//add dynamic settings to templates
						for (const setting of dashboard.layout.getSettings()) {
							//display
							const div = gimme("div").build();
							gimme("span").class(setting.name + "Display").textContent(setting.displayName + ": ").hidden(true).appendTo(div);
							gimme("span").class(setting.name).appendTo(div);

							let inst;
							if (setting.type === "module") {
								inst = dialog.querySelector(".inst_tmplt").content.querySelector(".config_instance");
							} else if (setting.type === "container") {
								inst = dialog.querySelector(".row_tmplt").content.querySelector(".rowHeader");
							}
							inst.appendChild(div);

							//edit
							const editDisplay = gimme("span").textContent(setting.displayName + ": ").build();
							const editInput = gimme("input").type("text").class(setting.name + "Setting").pattern(setting.validationString).build();

							editInput.addEventListener("change", function(){
								procValidation(this, setting);
							});
							const br = gimme("br").build();
							if (setting.type === "module") {
								const rEdit = dialog.querySelector(".instEdit");
								const deleteButton = dialog.querySelector(".cellDelete");

								rEdit.insertBefore(editDisplay, deleteButton);
								rEdit.insertBefore(editInput, deleteButton);
								rEdit.insertBefore(br, deleteButton);
							} else if (setting.type === "container") {
								const br2 = gimme("br").build();

								const rEdit = dialog.querySelector(".rowEdit");
								rEdit.prepend(br2);
								rEdit.prepend(editInput);
								rEdit.prepend(editDisplay);
								rEdit.prepend(br);
							}
						}

						//add cell button
						dialog.querySelector(".rowAddCell").addEventListener("click", function() {
							createInstance(dialog.selection);
						});

						//add row button
						dialog.querySelector(".rowAdd").addEventListener("click", function() {
							const row = createRow();
							createInstance(row);
						});

						//delete row button
						dialog.querySelector(".rowDelete").addEventListener("click", function() {
							const rows = dialog.querySelector(".editableTable").rows;

							//can't delete last row
							if (rows.length <= 1)
								return;

							//get selection before the deleted one, or the first one if it is the first one
							let newSelection = Array.from(rows).indexOf(dialog.selection)-1;
							newSelection = newSelection >= 0 ? newSelection : 0;

							dialog.selection.remove();
							dialog.selection = null;
							changeSelection(dialog.querySelectorAll(".row")[newSelection]);
						});

						//delete cell button
						dialog.querySelector(".cellDelete").addEventListener("click", function() {
							const cells = dialog.selection.parentNode.cells;

							//can't delete last cell (not including the row header)
							if (cells.length <= 2)
								return;

							//get selection before the deleted one, or the first one if it is the first one
							let newSelection = Array.from(cells).indexOf(dialog.selection) - 1;
							newSelection = newSelection >= 1 ? newSelection : 1;

							dialog.selection.remove();
							dialog.selection = null;
							changeSelection(cells[newSelection]);
						});

						//Add module select options
						const dialogBuilder = elementEditor(dialog.querySelector(".moduleSelect"));
						for (const moduleName in dashboard.modules) {
							const module = dashboard.modules[moduleName];
							//don't let the user select overrideLayout modules
							if (module.overrideLayout)
								continue;

							dialogBuilder.option(module.name, module.displayName);
						}

						//settings -> instances
						dialog.querySelector(".moduleSelect").addEventListener("change", function() {
							dialog.selection.querySelector(".config_module").textContent = dashboard.modules[this.value].displayName;
							dialog.selection.querySelector(".config_module_name").value = this.value;
						});

						dialog.querySelector(".toggleEditMode").addEventListener("click", function (e) {
							const guiEditor = dialog.querySelector(".guiEditor");
							dialog.querySelector(".textEditor").hidden = guiEditor.hidden;
							guiEditor.hidden = !guiEditor.hidden;

							if (guiEditor.hidden) {
								dialog.querySelector(".textareaEditor").value = getGuiString();
							} else {
								changeSelection(null);

								dialog.querySelector(".editableTable").textContent = "";
								loadConfig(JSON.parse(dialog.querySelector(".textareaEditor").value));

							}
						});
						dialog.querySelector(".textareaEditor").style.width = "90vw";

						dialog.querySelector(".cancel").addEventListener("click", function() {
							realDialog.close();
						});

						dialog.querySelector(".apply").addEventListener("click", function() {
							let output;

							if (!dialog.querySelector(".guiEditor").hidden) {
								output = getGuiString();
							} else {
								output = document.querySelector(".textareaEditor").value;
							}

							document.querySelector("#dashboard_config").value = output;
							realDialog.close();
						});

						//load config
						loadConfig(JSON.parse(document.querySelector("#dashboard_config").value));
					}

					gimme("span").textContent("Layout ").appendTo(parent);

					const button = gimme("input").type("button").value("Edit").build();

					const realDialog = gimme("dialog").class("configEditor").build();

					//stop all click propagation to realDialog
					const dialog = gimme("div").class("fake-dialog").build();
					dialog.addEventListener("click", function (e) {
						e.stopPropagation();
					});
					realDialog.appendChild(dialog);

					realDialog.addEventListener("click", function (e) {
						this.close();
					});

					parent.appendChild(realDialog);

					button.addEventListener("click", function() {
						if (document.querySelector("#default_dashboard_config").checked) {
							db_alert("Please disable the default checkbox to edit the config.");
							return;
						}

						loadLayout();
						realDialog.showModal();
					});
					parent.appendChild(button);
				},

				"default": '[[{"name":"maxHeight","value":"350px"},{"name":"todo","width":"300px"},{"name":"multitimer"}],[{"name":"textbox"}],[{"name":"codeEditor"},{"name":"keyCode","width":"250px"}],[{"name":"progressBar"}]]',
			}
		]
	},

	init: function(){
		const display = !getSetting(this.name, "displayFooterText") ? "none" : "block";
		document.querySelector("#footerText").style.display = display;
	},

	updates: function(){
		return[
			{ver: "1.0.0", func: function(){
					//This function relies on overrideLayouts running their update functions before other modules
					log("Splitting version numbers into a per module basis");
					const version = localStorage.getItem("lastVersion");
					const moduleVersions = {};
				for(let moduleName in dashboard.modules) {
					if(dashboard.modules[moduleName].updates) {
							moduleVersions[moduleName] = version;
						}
					}

					localStorage.setItem("db_versions", JSON.stringify(moduleVersions));
					localStorage.removeItem("lastVersion");
				}
			},
			{
				ver: "1.1.0", func: function() {
					log("Updating maxHeight to name/value.");
					let config = getSetting("dashboard", "config");
					if (!config)
						return;

					config = JSON.parse(config);
					let changed = false;
					for (let c = 0; c < config.length; c++) {
						for (let m = 0; m < config[c].length; m++) {
							if (!config[c][m].maxHeight)
								continue;

							config[c][m].module = "maxHeight";
							config[c][m].value = config[c][m].maxHeight;

							delete config[c][m].maxHeight;
							changed = true;
						}
					}
					if (changed) {
						let settings = JSON.parse(localStorage.getItem("settings"));
						settings.dashboard.config = JSON.stringify(config);
						localStorage.setItem("settings", JSON.stringify(settings));
					}
				}
			},
		];
	}
});

//start loading the layout when the page is done loading
if (document.readyState === 'complete') {
	dashboard.pageLoad();
} else {
	window.addEventListener("load", dashboard.pageLoad);
}
