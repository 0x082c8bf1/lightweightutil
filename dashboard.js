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

	startModules: function(){
		log("creating layout");
		dashboard.layout.create();

		for(let moduleName in dashboard.modules){
			let module = dashboard.modules[moduleName];

			log("Starting module: " + module.name);
		}
	},

	layout: {
		config: null,
		parsed: false,

		reload: function(){
			document.querySelector("#layout").innerHTML = "";
			dashboard.startModules();
		},

		//create a new module on the document body
		appendNewContainer: function(){
			let c = document.createElement("div");
			c.classList.add("container");
			document.querySelector("#layout").appendChild(c);
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
			if(this.config == null){
				this.config = localStorage.getItem("db_config");
			}

			//if the config is still not loaded, default it
			if (this.config == null){
				//default config if none exists
				log("Using default config.");
				this.config = [
					[{name: "multitimer"}],
					[{name: "textbox"}],
					[{name: "codeEditor"}, {name: "keyCode", width: "250px"}],
					[{name: "progressBar"}]
				];
				this.parsed = true;
				//TODO: Add a way to save this to localStorage optionally
//				localStorage.setItem("db_config", JSON.stringify(this.config));
			}

			if (!this.parsed){
				this.config = JSON.parse(this.config);
			}

			//create containers
			for(let cPos = 0; cPos<this.config.length; cPos++){
				let container = this.appendNewContainer();

				//create modules
				for(let mPos = 0; mPos<this.config[cPos].length; mPos++){
					let module = this.appendModuleToContainer(container);
					let mConfig = this.config[cPos][mPos];

					//apply module settings
					if (mConfig.width){
						module.style.maxWidth = mConfig.width;
					}

					//instantiate the module
					let instFunc = dashboard.modules[mConfig.name].instantiate;
					if (instFunc){
						instFunc(module);
					}

					//init the modules
					let imodule = dashboard.modules[mConfig.name];
					if (imodule.init){
						imodule.init();
					}
				}
			}
		},
	},
}

//start loading the modules when the page is done loading
if (document.readyState === 'complete') {
	dashboard.startModules();
} else {
	window.addEventListener("load", dashboard.startModules);
}
