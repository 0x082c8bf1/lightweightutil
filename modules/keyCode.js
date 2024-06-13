'use strict';
dashboard.registerModule({
	name: "keyCode",
	displayName: "KeyCode Reader",
	version: "1.0.1",

	init: function(inst){
		//add the event listener
		let input = inst.q(".focusBox");
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

			inst.q(".keycodeOutput").innerHTML = output;
			inst.q(".resetKeyCodeOutput").hidden = false;
		});

		inst.q(".resetKeyCodeOutput").addEventListener("click", function(){
			_this.resetKeyCodeOutput(inst);
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

	resetKeyCodeOutput: function(inst){
		inst.q(".keycodeOutput").innerHTML = "";
		inst.q(".focusBox").value = "";
		inst.q(".resetKeyCodeOutput").hidden = true;
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
