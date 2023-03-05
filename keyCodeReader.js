dashboard.registerModule({
	name: "keyCode",
	displayName: "KeyCode Reader",

	init: function(module){
		//add the event listener
		let input = module.q("#keycodeReader");
		input.addEventListener("keydown", function(event){
			input.value = "";
			event.preventDefault();

			let output = "";
			output += "code == \"" + event.code + "\"<br/>";
			output += "key == '" + event.key + "'<br/>";
			output += "ctrlKey == " + event.ctrlKey + "<br/>";
			output += "altKey == " + event.altKey + "<br/>";
			output += "shiftKey == " + event.shiftKey + "<br/>";
			output += "<s>keyCode == " + event.keyCode + "</s><br/>";
			output += "<s>which == " + event.which + "</s><br/>";

			module.q("#keycodeOutput").innerHTML = output;
			module.q("#resetKeyCodeOutput").hidden = false;
		});

		let _this = this;
		module.q("#resetKeyCodeOutput").addEventListener("click", function(){
			_this.resetKeyCodeOutput(module);
		});
	},

	instantiate: function(where){
		where.innerHTML = /*html*/`
			<div class="fs30b">KeyCode Reader</div>
			<input type="text" id="keycodeReader" placeholder="Click here" tabindex="-1"/>
			<div id="keycodeOutput"></div>
			<input type="button" id="resetKeyCodeOutput" hidden class="button" value="Reset"/>
		`
	},

	resetKeyCodeOutput: function(module){
		module.q("#keycodeOutput").innerHTML = "";
		module.q("#keycodeReader").value = "";
		module.q("#resetKeyCodeOutput").hidden = true;
	},

	registerDocumentation: function(){
		return [
			"The keycode reader will tell you what keys to press while the textbox is focused.",
			"It will give you various JavaScript measurements of the key that you have pressed so that you can use this information when you need key events in JavaScript.",
		]
	},
});
