//currently if you are adding a module, it will also need to be added as a script in index.html and added to the default config in dashboard.js
dashboard.registerModule({
	name: "example",
	displayName: "Example Module",

	//this is the code that is run after the module is added to the dom
	init: function(module){
		//the 'module' variable contains some helper functions such as q and qAll
		module.qAll("div")[1].innerHTML += "<br/><span>This was added in the init function</span>";

		//this is how you can use settings to affect your module
		if (getSetting(this.name,"exampleBool"))
			alert("hello from the example module.");
	},

	//the where object is the module that you are adding to
	//if this function does not exist, then it will not add a module.
	instantiate: function(where){
		where.innerHTML = /*html*/`
			<div class="fs30b">Example</div>
			<div>This is what the example module adds to the DOM.</div>
		`
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

	registerDocumentation: function(){
		return [
			"This is the text that will show up in the documentation tab.",
			"Multiple entires will be multiple lines.",
		]
	},
});
