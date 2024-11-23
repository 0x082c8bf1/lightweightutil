'use strict';
//currently if are adding a module, the module and any includes will need to be added as scripts in index.html
dashboard.registerModule({
	name: "example",
	displayName: "Example",
	version: "1.0.1",
	include: ["example_inc"],

	//this is the code that is run after the instance is added to the DOM
	init: function(inst){
		//the 'inst' variable contains some helper functions such as q and qAll
		const div = inst.qAll("div")[1];

		//using the elementEditor to create elements
		gimme("br").appendTo(div);
		gimme("span").textContent("This was added in the init function").appendTo(div);

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
		setInnerHTML(where, /*html*/`
			<div class="fs30b">Example</div>
			<input type="button" class="click" value="0"/>
			<div class="exampleText">This is what the example module adds to the DOM.</div>
		`);
	},

	//this is uses in example_tests to show accessing module functions
	return4: function(){
		return 4;
	},

	getStyle: function(){
		return /*css*/`
			.exampleText {
				color: yellow;
			}
		`;
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
				const oldSave = localStorage.getItem("exampleData");
				localStorage.setItem("exampleData", oldSave+"newData");
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
