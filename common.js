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
