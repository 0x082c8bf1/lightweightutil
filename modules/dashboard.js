'use strict';
let dashboard = {
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
		const downloadAnchor = document.createElement("a");

		const date = new Date();
		let dateStr = date.getFullYear();
		dateStr += "-" + ((date.getMonth()+1) + "").padStart(2,0);
		dateStr += "-" + ((date.getDate() + "").padStart(2,0));

		downloadAnchor.setAttribute("download","lwutilExport-" + dateStr + ".json");
		downloadAnchor.setAttribute("href", 'data:text/plain;charset=utf-8,' + encodeURIComponent(string));
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
			const e = document.createElement("option");
			e.value = module.name;
			e.innerHTML = module.displayName;
			layouts.appendChild(e);
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
			document.querySelector("#layout").innerHTML = "";
		},

		//dashboard.layout.appendNewContainer(location)
		//create a new instance in the DOM
		appendNewContainer: function(location){
			const c = document.createElement("div");
			c.classList.add("container");
			location.appendChild(c);
			return c;
		},

		//dashboard.layout.appendInstanceToContainer(container)
		//add a module to a container
		appendInstanceToContainer: function(container){
			const m = document.createElement("div");
			m.classList.add("instance");
			container.appendChild(m);
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
			config = JSON.parse(config);

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
				dashboard.layout.updateModule(dashboard.modules[m].name);
			}

			//create containers
			dashboard.layout.nextInstanceId = 0;
			for(let cPos = 0; cPos<config.length; cPos++){
				const container = this.appendNewContainer(document.querySelector("#layout"));

				//create instances
				for(let mPos = 0; mPos<config[cPos].length; mPos++){

					//container settings
					const mConfig = config[cPos][mPos];
					if (!mConfig.name) {
						if (mConfig.hasOwnProperty("maxHeight")){
							container.style.maxHeight = mConfig.maxHeight;
						}

						//don't parse the setting as an instance
						continue;
					}

					if (!dashboard.modules[mConfig.name]) {
						error("Failed to load module from config: " + mConfig.name);
						continue;
					}

					const instRoot = this.appendInstanceToContainer(container);
					instRoot.classList.add(mConfig.name);

					//apply instance settings
					if (mConfig.width){
						instRoot.style.maxWidth = mConfig.width;
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
			document.querySelector("#docs").innerHTML = "";
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
			const entry = document.createElement("li");
			const anchor = document.createElement("a");
			anchor.href = "";
			anchor.addEventListener("click", function(e){
				e.preventDefault();
				document.querySelector("#" + module.name).scrollIntoView();
			});
			anchor.innerHTML = module.displayName;
			entry.appendChild(anchor);
			document.querySelector("#docIndex").appendChild(entry);

			//add the header element
			const title = document.createElement("div");
			const displayName = module.displayName;
			title.innerHTML = displayName ? displayName : name;
			title.classList.add("fs30b");
			title.id = module.name;
			element.appendChild(title);

			//create p elements for every mDoc[i]
			for(let i=0; i<mDocs.length; i++){
				const paragraph = document.createElement("p");
				paragraph.innerHTML = mDocs[i];
				element.appendChild(paragraph);
			}
		},
	},

	//dashboard.settings
	settings: {
		//dashboard.settings.createPane()
		createPane: function(){
			document.querySelector("#settings").innerHTML = "";

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

			const title = document.createElement("div");
			const displayName = dashboard.modules[moduleName].displayName;
			title.innerHTML = displayName ? displayName : moduleName;
			title.classList.add("fs30b");
			element.appendChild(title);

			//go through the settings and create the entries for them
			for(let i=0; i<mSettings.length; i++){
				const tempId = moduleName + "_" + mSettings[i].name;

				//default checkbox
				const defaultInput = document.createElement("input");
				defaultInput.type = "checkbox";
				defaultInput.checked = getSettingFromStorage(moduleName, mSettings[i].name) == null;
				defaultInput.id = "default_" + moduleName + "_" + mSettings[i].name;
				defaultInput.setAttribute("autocomplete", "off");
				defaultInput.managing = tempId;
				element.appendChild(defaultInput);
				defaultInput.addEventListener("change", function(){
					document.querySelector("#" + this.managing).disabled = this.checked;
				});

				//append input
				let input;
				const value = getSetting(moduleName, mSettings[i].name);

				switch(mSettings[i].type){
					case "bool":
						input = document.createElement("input");
						input.type = "checkbox";
						input.checked = value ? true : false;
						break;
					case "text":
						input = document.createElement("input");
						input.type = "text";
						input.value = value;
						break;
					case "number":
						input = document.createElement("input");
						input.type = "number";
						input.value = value;
				}
				input.setAttribute("autocomplete", "off");

				//disable if defaulted
				if (document.querySelector("#default_"+tempId).checked) {
					input.disabled = true;
				}

				//setup label and input ID
				input.id = tempId;
				const desc = document.createElement("label");
				desc.setAttribute("for", input.id);

				//tell the element what it is
				input.dataType = mSettings[i].type;
				input.name = mSettings[i].name;
				input.module = moduleName;
				input.classList.add("settingInput");

				element.appendChild(input);

				//append description
				desc.innerHTML = mSettings[i].description;
				element.appendChild(desc);

				//append line break
				const br = document.createElement("br");
				element.appendChild(br);
			}

			document.querySelector("#settings").appendChild(element);
		},

	},

	//dashboard.tests
	tests : {
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
			const script = document.createElement("script");
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
	version: "1.1.0",
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
				"description": "Config JSON object",
				"type": "text",
				"default": '[[{"maxHeight": "350px"},{"name": "todo", "width": "300px"},{"name": "multitimer"}],[{"name": "textbox"}],[{"name": "codeEditor"}, {"name": "keyCode", "width": "250px"}],[{"name": "progressBar"}]]',
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
			}},
		];
	}
});

//start loading the layout when the page is done loading
if (document.readyState === 'complete') {
	dashboard.pageLoad();
} else {
	window.addEventListener("load", dashboard.pageLoad);
}
