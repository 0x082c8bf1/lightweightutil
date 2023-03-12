var dashboard = {
	modules: [],

	//registers a module object
	registerModule: function(module){
		//error checking
		if (!module.name){
			console.error("Module must have a name.");
			return;
		}

		if (this.modules[module.name]){
			console.error("Module " + module.name + " already exsits.");
			return;
		}

		//save the module
		this.modules[module.name] = module;

		log("Registed module: " + module.name);
	},

	togglePane: function(toPane){
		let panes = {
			settings: {pane: document.querySelector("#settingsPane"), funcs: dashboard.settings},
			layout: {pane: document.querySelector("#layout")},
			documentation: {pane: document.querySelector("#documentationPane"), funcs: dashboard.documentation}
		};

		//get current pane
		let currentPane;
		for(p in panes){
			if (!panes[p].pane.hidden)
				currentPane = p;
		}

		if (panes[currentPane].funcs?.checkLeave && !panes[currentPane].funcs.checkLeave()){
			return;
		}

		//handle toggle
		if (!panes[toPane].pane.hidden){
			toPane = "layout";
		}

		//hide all panes
		for(p in panes){
			panes[p].pane.hidden = true;
		}

		//unhide appropriate pane
		panes[toPane].funcs?.createPane();
		panes[toPane].pane.hidden = false;
	},

	pageLoad: function(){
		document.querySelector("#reloadLayout").addEventListener("click", function(){
			dashboard.layout.reload();
		});
		document.querySelector("#settingsToggle").addEventListener("click", function(){
			dashboard.togglePane("settings");
		});
		document.querySelector("#documentationToggle").addEventListener("click", function(){
			dashboard.togglePane("documentation");
		});
		document.querySelector("#export").addEventListener("click",function(){
			let obj = {"storage" : {},"jsonFields" : []};
			for(let i = 0, key = localStorage.key(i); i < localStorage.length; i++, key=localStorage.key(i)){
				let value = localStorage.getItem(key);

				try {
					value = JSON.parse(value);
					//save that it's a json object
					obj.jsonFields.push(key);
				} catch (e){}

				obj["storage"][key] = value;
			}
			let string = JSON.stringify(obj, null, "\t") + "\n";

			//download the file
			let downloadAnchor = document.createElement("a");

			let date = new Date();
			let dateStr = date.getFullYear();
			dateStr += "-" + ((date.getMonth()+1) + "").padStart(2,0);
			dateStr += "-" + ((date.getDate() + "").padStart(2,0));

			downloadAnchor.setAttribute("download","lwutilExport-" + dateStr + ".json");
			downloadAnchor.setAttribute("href", 'data:text/plain;charset=utf-8,' + encodeURIComponent(string));
			downloadAnchor.style.display = "none";
			document.body.appendChild(downloadAnchor);
			downloadAnchor.click();
			document.body.removeChild(downloadAnchor);
		});

		document.querySelector("#importFile").addEventListener("change", function(){
			document.querySelector("#fileSelectDisplay").innerHTML = this.files[0].name;
		});

		document.querySelector("#importFile").value = "";

		document.querySelector("#import").addEventListener("click",function(){
			const [file] = document.querySelector("#importFile").files;

			if (!file)
				return;

			let doRead = confirm("Importing data will wipe all currently saved data. Would you like to continue?");
			if (!doRead)
				return;

			//reset localStorage
			localStorage.clear();

			//load new data
			let fileReader = new FileReader();
			fileReader.readAsText(file);
			fileReader.addEventListener("load", function(){
			let file = JSON.parse(fileReader.result);
			let storage = file["storage"];
			let jsonFields = file["jsonFields"];

			localStorage.setItem("lastVersion",storage["lastVersion"]);
			for(let k in storage){
				if (k=="lastVersion")
					continue;

				let data = storage[k];
				if (jsonFields.includes(k))
					data = JSON.stringify(data);

				localStorage.setItem(k, data);
			}

			dashboard.layout.reload();

			document.querySelector("#importFile").value = "";
			document.querySelector("#fileSelectDisplay").innerHTML = "No file selected.";
		});

		});
		document.querySelector("#saveSettings").addEventListener("click", function(){
			dashboard.settings.saveSettings();
		});
		dashboard.startModules();
	},

	startModules: function(){
		log("creating layout");
		dashboard.layout.create();

		for(let moduleName in dashboard.modules){
			let module = dashboard.modules[moduleName];

			log("Starting module: " + module.name);
		}
	},

	layout: {
		reload: function(){
			document.querySelector("#layout").innerHTML = "";
			dashboard.startModules();
		},

		//create a new module on the document body
		appendNewContainer: function(location){
			let c = document.createElement("div");
			c.classList.add("container");
			location.appendChild(c);
			return c;
		},

		//add a module to a container
		appendModuleToContainer: function(container){
			let m = document.createElement("div");
			m.classList.add("module");
			container.appendChild(m);
			return m;
		},

		create: function(){
			//if the config is not loaded, try to load it
			let config = localStorage.getItem("db_config");

			//if the config is still not loaded, default it
			if (config == null){
				//default config if none exists
				log("Using default config.");
				config =
				`[
					[{"name": "multitimer"}],
					[{"name": "textbox"}],
					[{"name": "codeEditor"}, {"name": "keyCode", "width": "250px"}],
					[{"name": "progressBar"}]
				]`;

				//TODO: Add a way to save this to localStorage optionally
//				localStorage.setItem("db_config", JSON.stringify(config));
			}

			config = JSON.parse(config);

			//create containers
			for(let cPos = 0; cPos<config.length; cPos++){
				let container = this.appendNewContainer(document.querySelector("#layout"));

				//create modules
				for(let mPos = 0; mPos<config[cPos].length; mPos++){
					let module = this.appendModuleToContainer(container);
					let mConfig = config[cPos][mPos];

					//apply module settings
					if (mConfig.width){
						module.style.maxWidth = mConfig.width;
					}

					//handle updates
					let lver = localStorage.getItem("lastVersion");
					if (version > lver || (!lver && localStorage.length > 0)){
						let updateFunc = dashboard.modules[mConfig.name].updates;
						if (updateFunc){
							let updates = updateFunc();
							for(let i=0; i<updates.length; i++){
								if (updates[i].ver < version){
									updates[i].func();
								}
							}
						}
					}

					//instantiate the module
					let instFunc = dashboard.modules[mConfig.name].instantiate;
					if (instFunc){
						instFunc(module);
					}

					//create the module instance
					let instance = {
						"module": module,
						q: function(selector){
							if (selector.includes("#")){
								log(mConfig.name + " is using an id q, this is not recommended.");
							}
							return this.module.querySelector(selector);
						},
						qAll: function(selector){
							if (selector.includes("#")){
								log(mConfig.name + " is using an id qAll, this is really not recommended.");
							}
							return this.module.querySelectorAll(selector);
						}
					};

					let imodule = dashboard.modules[mConfig.name];
					//save the module instance on the module template
					if (!imodule.instances)
						imodule.instances = [];
					imodule.instances.push(instance);

					//call the init function on the module
					if (imodule.init){
						imodule.init(instance);
					}
				}
			}
			localStorage.setItem("lastVersion", version);
		},
	},
	documentation: {
		createPane: function(){
			document.querySelector("#docs").innerHTML = "";
			document.querySelector("#docIndex").innerHTML = "";

			for(let moduleName in dashboard.modules){
				dashboard.documentation.createDocumentationModule(moduleName);
			}
		},

		createDocumentationModule: function(name){
			let module = dashboard.modules[name];
			let mDocsFunc = module.registerDocumentation;
			if (!mDocsFunc)
				return;

			let mDocs = mDocsFunc();

			//if the module has a docs function, we create a module for it
			let container = dashboard.layout.appendNewContainer(document.querySelector("#docs"));
			let element = dashboard.layout.appendModuleToContainer(container);

			//add the element to the index
			let entry = document.createElement("li");
			let a = document.createElement("a");
			a.href = "#" + module.name;
			a.innerHTML = module.displayName;
			entry.appendChild(a);
			document.querySelector("#docIndex").appendChild(entry);

			//add the header element
			let title = document.createElement("div");
			let displayName = module.displayName;
			title.innerHTML = displayName ? displayName : name;
			title.classList.add("fs30b");
			title.id = module.name;
			element.appendChild(title);

			//create p elements for every mDoc[i]
			for(let i=0; i<mDocs.length; i++){
				let p = document.createElement("p");
				p.innerHTML = mDocs[i];
				element.appendChild(p);
			}
		},
	},

	settings: {
		createPane: function(){
			document.querySelector("#settings").innerHTML = "";

			for(let moduleName in dashboard.modules){
				dashboard.settings.createModule(moduleName);
			}
		},

		checkLeave: function(){
			let discard = true;
			if (!document.querySelector("#settingsPane").hidden){
				let unsavedSettings = JSON.stringify(dashboard.settings.getNewSettings());
				let savedSettings = localStorage.getItem("settings");
				//if the user has never saved settings before
				if (!savedSettings){
					let save = confirm("You have no saved settings, would you like to save?")
					if (save) {
						dashboard.settings.saveSettings();
					}
				}

				//if the user has unsaved settings
				if (savedSettings && savedSettings != unsavedSettings){
					discard = confirm("You have unsaved settings, would you like to discard them?");
				}
			}
			return discard
		},

		getNewSettings: function(){
			let settings = document.querySelectorAll(".settingInput");
			let newSettings = {};
			for(let i=0; i<settings.length; i++){
				let value;
				switch(settings[i].dataType){
					case "bool":
						value = settings[i].checked;
						break;
					case "text":
						value = settings[i].value;
						break;
				}

				if (newSettings[settings[i].module] == null)
					newSettings[settings[i].module] = {};

				newSettings[settings[i].module][settings[i].name] = value;
			}

			return newSettings;
		},

		saveSettings: function(){
			let newSettings = dashboard.settings.getNewSettings();
			localStorage.setItem("settings", JSON.stringify(newSettings));
		},

		createModule: function(name){
			let module = dashboard.modules[name];
			let mSettingsFunc = module.registerSettings;
			if (!mSettingsFunc)
				return;

			let mSettings = mSettingsFunc();

			//if the module has a settings function, we create a module for it
			let container = dashboard.layout.appendNewContainer(document.querySelector("#settingsPane"));
			let element = dashboard.layout.appendModuleToContainer(container);

			let title = document.createElement("div");
			let displayName = dashboard.modules[name]["displayName"];
			title.innerHTML = displayName ? displayName : name;
			title.classList.add("fs30b");
			element.appendChild(title);

			//go through the settings and create the entries for them
			for(let i=0; i<mSettings.length; i++){
				//append input
				let input;
				let value = getSetting(name, mSettings[i]["name"]);

				switch(mSettings[i]["type"]){
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
				}

				//setup label and input ID
				input.id = name + "_" + mSettings[i]["name"];
				let desc = document.createElement("label");
				desc.setAttribute("for", input.id);

				//tell the element what it is
				input.dataType = mSettings[i]["type"];
				input.name = mSettings[i]["name"];
				input.module = name;
				input.classList.add("settingInput");

				element.appendChild(input);

				//append description
				desc.innerHTML = mSettings[i]["description"];
				element.appendChild(desc);

				//append linebreak
				let br = document.createElement("br");
				element.appendChild(br);
			}

			document.querySelector("#settings").appendChild(element);
		},

	}
}

//start loading the modules when the page is done loading
if (document.readyState === 'complete') {
	dashboard.pageLoad();
} else {
	window.addEventListener("load", dashboard.pageLoad);
}
