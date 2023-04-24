dashboard.registerModule({
	name: "keyCode",
	displayName: "KeyCode Reader",

	init: function(module){
		//add the event listener
		let input = module.q(".focusBox");
		let _this = this;

		input.addEventListener("keydown", function(event){
			input.value = "";
			event.preventDefault();

			let pre = getSetting(_this.name, "eventPrefix");
			let post = getSetting(_this.name, "eventSuffix");

			let output = "";
			output += pre + "code == \"" + event.code + "\"" + post + "<br/>";
			output += pre + "key == '" + event.key + "'" + post + "<br/>";
			output += pre + "ctrlKey == " + event.ctrlKey + post + "<br/>";
			output += pre + "altKey == " + event.altKey + post + "<br/>";
			output += pre + "shiftKey == " + event.shiftKey + post + "<br/>";
			output += pre + "<s>keyCode == " + event.keyCode + post + "</s><br/>";
			output += pre + "<s>which == " + event.which + post + "</s><br/>";

			module.q(".keycodeOutput").innerHTML = output;
			module.q(".resetKeyCodeOutput").hidden = false;
		});

		module.q(".resetKeyCodeOutput").addEventListener("click", function(){
			_this.resetKeyCodeOutput(module);
		});
	},

	instantiate: function(where){
		where.innerHTML = /*html*/`
			<div class="fs30b">KeyCode Reader</div>
			<input type="text" class="focusBox" placeholder="Click here" tabindex="-1"/>
			<div class="keycodeOutput"></div>
			<input type="button" class="resetKeyCodeOutput" value="Reset" hidden/>
		`
	},

	resetKeyCodeOutput: function(module){
		module.q(".keycodeOutput").innerHTML = "";
		module.q(".focusBox").value = "";
		module.q(".resetKeyCodeOutput").hidden = true;
	},

	registerSettings: function(){
		return [
			{
				"name": "eventPrefix",
				"description": "Prefix when displaying output.",
				"type": "text",
				"default": "",
			},
			{
				"name": "eventSuffix",
				"description": "Suffix when displaying output.",
				"type": "text",
				"default": "",
			},
		]
	},

	registerDocumentation: function(){
		return [
			"The keycode reader will tell you what keys to press while the textbox is focused.",
			"It will give you various JavaScript measurements of the key that you have pressed so that you can use this information when you need key events in JavaScript.",
		]
	},
});
