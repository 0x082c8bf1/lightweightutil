'use strict';
//currently if you are adding a module, it will also need to be added as a script in index.html and added to the default config in dashboard.js
dashboard.registerModule({
	name: "example",
	displayName: "Example",
	version: "1.0.1",
	include: ["example_inc"],

	//this is the code that is run after the instance is added to the DOM
	init: function(inst){
		//the 'inst' variable contains some helper functions such as q and qAll
		inst.qAll("div")[1].innerHTML += "<br/><span>This was added in the init function</span>";

		//this is how you can use settings to affect your module
		if (getSetting(this.name,"exampleBool"))
			db_alert("hello from the example module.");

		//function defined from an include
		this.includeFunction();

		inst.q(".click").addEventListener("click", function(){
			this.value = +this.value + 1;
		});
	},

	//the "where" object is the element that is being added to
	//if this function does not exist, then it will not add an instance to the DOM.
	instantiate: function(where){
		where.innerHTML = /*html*/`
			<div class="fs30b">Example</div>
			<input type="button" class="click" value="0"/>
			<div>This is what the example module adds to the DOM.</div>
		`
	},

	//this is uses in example_tests to show accessing module functions
	return4: function(){
		return 4;
	},

	//this is where you can add settings
	registerSettings: function(){
		return [
			{
				"name": "exampleText",
				"description": "this is a text setting.",
				"type": "text",
				"default": "default value",
			},
			{
				"name": "exampleBool",
				"description": "this is a boolean setting.",
				"type": "bool",
				"default": false,
			},
			{
				"name": "exampleNumber",
				"description": "this is a number setting.",
				"type": "number",
				"default": 1,
			},
		]
	},

	//Update function are called when the module has updated and the data needs to be
	//	updated before being used. The modules version number will need to be bumped every
	//	time an entry is added here.
	// ver - The last version that the data worked on
	// func - the function to call to update the data
	updates: function(){
		return [
			{ver: "1.0.1", func: function(){
				log("Updating data.");
				let oldSave = localStorage.getItem("exampleData");
				localStorage.setItem("mt_timers", oldSave+"newData");
			}},
		];
	},

	registerDocumentation: function(){
		return [
			"This is the text that will show up in the documentation tab.",
			"Multiple entries will be multiple lines.",
		]
	},
});
