'use strict';
//this is used for intentional logging, as opposed to debug printing.
function log(m){
	console.log(m);
}

function error(errorString, error){
	console.error(errorString, error);
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
				const override = dashboard.tests.overrideSettings[module][setting];
				return override;
			}
		}
	}

	//check if the setting is saved
	const retrievedValue = getSettingFromStorage(module, setting);

	//if the setting is not saved, get the default value
	if (retrievedValue == null) {
		const settings = dashboard.modules[module].registerSettings();
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
	const settings = dashboard.modules[module]?.registerSettings();
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

		const moduleSettings = settings[module];
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

// Chain create document elements
function gimme(tag) {
	const element = document.createElement(tag);
	applySpecialElementProperties(element);

	return elementEditor(element);
}

function elementEditor(element) {
	// Tags that don't have any additonal processing
	const attributes = [
		"for",
		"hidden",
		"href",
		"id",
		"innerHTML",
		"pattern",
		"textContent",
		"type",
	];

	let funcs = {
		class: function(value) {
			const classes = value.split(/\s/);
			for(let i=0; i<classes.length; i++) {
				element.classList.add(classes[i]);
			}
			return this;
		},

		// Use true/false for checkboxes checked/unchecked
		value: function(value) {
			if (element.type === "checkbox") {
				element.checked = value;
			} else {
				element.value = value;
			}
			return this;
		},

		// used for adding selectElements
		option: function(value, displayValue) {
			gimme("option").value(value).textContent(displayValue).appendTo(element);
			return this;
		},

		// return final element
		build: function() {
			return element;
		},

		//append the final element to parent
		appendTo: function(parent) {
			parent.appendChild(element);
			return element;
		}
	};

	//add generic attributes
	for(let i=0; i<attributes.length; i++) {
		funcs[attributes[i]] = function(value) {
			element[attributes[i]] = value;
			return this;
		}

	}
	return funcs;
}

// Take an element and apply all of the standard effects to it's children
function applySpecialElementProperties(element){
	let elements = element.querySelectorAll("input");
	for(let e of elements) {
		e.autocomplete="off";
	}
}

function cloneTemplate(template){
	const clone = template.content.cloneNode(true);
	applySpecialElementProperties(clone);
	return clone;
}

// Append children from a string while applying all standard effects
function setInnerHTML(parent, string) {
	// Remove leading and trailing whitespace
	string = string.split('\n').map(line => line.trim()).join('\n');

	// Create temporary div and apply effects
	let tempDiv = document.createElement("div");
	tempDiv.innerHTML = string;
	applySpecialElementProperties(tempDiv);

	// Move the children to the real parent
	parent.innerHTML = tempDiv.innerHTML;
}

// Format a Date object in yyyy-mm-dd, if utc is true it's assumed
// that the date is in the current timezone.
function getFormattedDate(date, utc=false){
	let output;
	if (utc) {
		output = (''+date.getUTCFullYear()).padStart(4,"0") + "-";
		output += (''+(date.getUTCMonth()+1)).padStart(2,"0") + "-";
		output += (''+date.getUTCDate()).padStart(2,"0");
	} else {
		output = (''+date.getFullYear()).padStart(4,"0") + "-";
		output += (''+(date.getMonth()+1)).padStart(2,"0") + "-";
		output += (''+date.getDate()).padStart(2,"0");
	}

	return output;
}
