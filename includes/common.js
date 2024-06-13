'use strict';
//this is used for intentional logging, as opposed to debug printing.
function log(m){
	console.log(m);
}

function error(e){
	console.error(e);
}

function getSetting(module, setting){
	//check input validity
	if (typeof module !== "string"){
		error("getSetting module must be a string.");
		return;
	}

	//check for tests override
	if (dashboard.tests.enabled) {
		if (dashboard.tests.overrideSettings[module]) {
			// using hasOwnProperty here so that we can check if it exists even if it's false
			if (dashboard.tests.overrideSettings[module].hasOwnProperty(setting)) {
				let override = dashboard.tests.overrideSettings[module][setting];
				return override;
			}
		}
	}

	//check if the setting is saved
	let retrievedValue = getSettingFromStorage(module, setting);

	//if the setting is not saved, get the default value
	if (retrievedValue == null) {
		let settings = dashboard.modules[module].registerSettings();
		for(let i=0; i<settings.length; i++){
			if (settings[i].name == setting){
				return settings[i].default;
			}
		}
		error("Invalid setting being read.");
	}

	return retrievedValue;
}

// returns true or false if the setting exists or not
function settingExists(module, setting){
	let settings = dashboard.modules[module]?.registerSettings();
	if (!settings) {
		error("Module " + module + " could not be found.");
		return false;
	}

	for(let i=0; i<settings.length; i++){
		if (settings[i].name == setting){
			return true;
		}
	}
	return false;
}

//check if a setting was manually set by the user or is being defaulted
function getSettingFromStorage(module, setting) {
	let settings = localStorage.getItem("settings");

	let retrievedValue = null;
	if (settings != null) {
		settings = JSON.parse(settings);

		let moduleSettings = settings[module];
		if (moduleSettings != null)
			retrievedValue = moduleSettings[setting];
	}

	return retrievedValue;
}

//clamp a number to min and max
function clamp(number, min, max) {
	return Math.min(Math.max(number, min), max);
}

function db_alert(a){
	if (!dashboard.tests.enabled)
		alert(a);
}

function db_confirm(a) {
	if (!dashboard.tests.enabled) {
		return confirm(a);
	} else {
		return true;
	}
}
