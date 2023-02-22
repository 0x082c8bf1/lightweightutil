//returns the module of the passed element, or null if it is not in a module
function getModule(element){
	return getParentOfClass(element, "module");
}

//returns the most closeset parent that contains a current class or null if one is not found.
function getParentOfClass(element, className){
	while (element != document.body && !element.classList.contains(className)){
		element = element.parentElement;
	}
	if (element == document.body)
		return null;

	return element;
}

//this is used for intentional logging, as opposed to debug printing.
function log(m){
	console.log(m);
}

function getSetting(module, setting){
	let settings = localStorage.getItem("settings");

	//check if the setting is saved
	let retrievedValue = null
	if (settings != null) {
		settings = JSON.parse(settings);

		let retrievedModule = settings[module];
		if (retrievedModule != null)
			retrievedValue = retrievedModule[setting];
	}

	//if the setting is not saved, get the default value
	if (retrievedValue == null) {
		let settings = dashboard.modules[module].registerSettings();
		for(let i=0; i<settings.length; i++){
			if (settings[i]["name"] == setting){
				return settings[i]["default"];
			}
		}
		console.error("Invalid setting being read.");
	}

	return settings[module][setting];
}
