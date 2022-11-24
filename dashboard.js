var dashboard = {
	pendingInits: [],
	modules: [],
	hasRun: false,

	//calls the function passed to it when the page is done loading, or right away if the page is already loaded
	setOnLoad: function(m){
		if(!dashboard.hasRun){
			dashboard.pendingInits.push(m);
		}else{
			m.init();
		}
	},

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

		console.log("Registed module: " + module.name);
	},

	//take the modules and create their elements, then call the onload handler
	startModules: function(){
		console.log("creating layout");
		dashboard.createLayout();
		
		for(let moduleName in dashboard.modules){
			let module = dashboard.modules[moduleName];

			console.log("Starting module: " + module.name);

			//run the modules init function if one exists
			if (module.init){
				module.init();
			}
		}
	},

	//calls all of the functions and purges the list
	processOnLoad: function(){
		hasRun = true;
		for(let i=dashboard.pendingInits.length-1; i>=0; i--){
			dashboard.pendingInits[i].init();
			dashboard.pendingInits.pop();
		}
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

	createLayout: function(){
		let config = [
			[{name: "multitimer"}],
			[{name: "textbox"}],
			[{name: "codeEditor"}, {name: "keyCode", width: "250px"}],
			[{name: "progressBar"}]
		];

		//create containers
		for(let cPos = 0; cPos<config.length; cPos++){
			let container = this.appendNewContainer();
			
			//create modules
			for(let mPos = 0; mPos<config[cPos].length; mPos++){
				let module = this.appendModuleToContainer(container);

				let mConfig = config[cPos][mPos];

				//apply module settings
				if (mConfig.width){
					console.log("width");
					module.style.maxWidth = mConfig.width;
				}

				//instantiate the module
				let instFunc = this.modules[mConfig.name].instantiate;
				if (instFunc){
					instFunc(module);
				}
			}
		}
	},
}

//start loading the modules when the page is done loading
if (document.readyState === 'complete') {
	dashboard.startModules();
} else {
	window.addEventListener("load", dashboard.startModules);
}
