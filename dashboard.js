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
		//set the modules init function if one exists
		if (module.init){
			dashboard.setOnLoad(module);
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
}

//call all of the registered functions when the page is loaded
if (document.readyState === 'complete') {
	dashboard.processOnLoad();
} else {
	window.addEventListener("load", dashboard.processOnLoad);
}
