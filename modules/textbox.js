'use strict';
dashboard.registerModule({
	name: "textbox",
	displayName: "TextBox",
	version: "1.0.1",

	//updates the character and word counts of the text area
	//words are considered any string of non-whitespace seperated by whitespace on either side
	updateCharacterCounts: function(module){
		let input = module.q(".textarea").value;

		//character count
		module.q(".characterCount").innerHTML = input.length;

		//word count
		let truncatedInput = input.trim();
		let words = truncatedInput.split(new RegExp(/\s+/));

		let wordCount = 0;
		if(truncatedInput!="")
			wordCount = words.length;

		module.q(".wordCount").innerHTML = wordCount;

		let lines = input.split("\n").length;
		module.q(".lineCount").innerHTML = lines;
	},

	//sorts all of the lines in the textbox alphabetically (does not ignore case)
	alphabetizeLines: function(module){
		let input = module.q(".textarea");
		let lines = input.value.split("\n");
		lines.sort();

		let output = "";
		for(let i=0; i<lines.length; i++){
			output += lines[i];
			if(i != lines.length-1){//if not the last line
				output += "\n";
			}
		}

		input.value = output;
	},

	toUpper: function(module){
		let input = module.q(".textarea");
		input.value = input.value.toUpperCase();
	},

	toLower: function(module){
		let input = module.q(".textarea");
		input.value = input.value.toLowerCase();
	},

	toRandom: function(module){
		let output = "";
		let input = module.q(".textarea");
		let text = input.value;
		for(let i=0; i<text.length; i++){
			let number = Math.floor(Math.random() * 2);
			output += (number===0 ? text[i].toLowerCase() : text[i].toUpperCase());
		}
		input.value = output;
	},

	toInvert: function(module){
		let output = "";
		let input = module.q(".textarea");
		let text = input.value;
		for(let i=0; i<text.length; i++){
			output += ((text[i] >= 'A' && text[i] <= 'Z') ? text[i].toLowerCase() : text[i].toUpperCase());
		}
		input.value = output;
	},

	removeDuplicateLines: function(module){
		let textbox = module.q(".textarea");
		let lines = textbox.value.split("\n");
		let outputArr = [];

		//create de-duplicated array
		for(let i=0; i<lines.length; i++) {
			if (!outputArr.includes(lines[i])) {
				outputArr.push(lines[i]);
			}
		}

		//convert new array back to a string
		let output = "";
		for(let i=0; i<outputArr.length; i++) {
			output += outputArr[i];
			if (i != outputArr.length-1) {
				output += "\n";
			}
		}
		textbox.value = output;
		this.updateCharacterCounts(module);
	},

	replace: function(module){
		let inputPattern, outputPattern;
		let input = module.q(".textarea");

		//regex matching
		if (module.q(".regexSearch").checked) {
			inputPattern = new RegExp(module.q(".replaceInputPattern").value, 'g');
			try {
				let data ="[\"" + module.q(".replaceOutputPattern").value + "\"]";
				outputPattern = JSON.parse(data)[0];
			} catch (e) {
				return;
			}
			input.value = input.value.replace(inputPattern, outputPattern);
		} else {
			//plaintext matching
			inputPattern = module.q(".replaceInputPattern").value;
			outputPattern = module.q(".replaceOutputPattern").value;
			input.value = input.value.replaceAll(inputPattern, outputPattern);
		}
	},

	handleFind: function(module, e){
		if(e.key == 'f' && e.ctrlKey) {
			e.preventDefault();

			let fs = module.q(".findSpan");
			let searching = document.activeElement.closest(".findSpan");

			if (fs.hidden || searching)
				fs.hidden = !fs.hidden;

			if (!fs.hidden) {
				module.q(".replaceInputPattern").focus();
			} else {
				module.q(".textarea").focus();
			}
		}
	},

	init: function(module){
		let _this = this;
		module.q(".tb_sort").addEventListener("click",function(){
			_this.alphabetizeLines(module);
		});
		let uc_button = module.q(".tb_toupper");
		let lc_button = module.q(".tb_tolower");
		let rc_button = module.q(".tb_torand");
		let ic_button = module.q(".tb_toinvert");
		let rd_button = module.q(".tb_removeDupes");

		//apply hide settings
		if (!getSetting(_this.name, "showUpperButton")){
			uc_button.hidden = true;
		}
		if (!getSetting(_this.name, "showLowerButton")){
			lc_button.hidden = true;
		}
		if (!getSetting(_this.name, "showRandomButton")){
			rc_button.hidden = true;
		}
		if (!getSetting(_this.name, "showInvertButton")){
			ic_button.hidden = true;
		}
		if (!getSetting(_this.name, "showRemoveDuplicatesButton")){
			rd_button.hidden = true;
		}

		//add event listeners
		uc_button.addEventListener("click",function(){
			_this.toUpper(module);
		});
		lc_button.addEventListener("click",function(){
			_this.toLower(module);
		});
		rc_button.addEventListener("click",function(){
			_this.toRandom(module);
		});
		ic_button.addEventListener("click",function(){
			_this.toInvert(module);
		});
		rd_button.addEventListener("click",function(){
			_this.removeDuplicateLines(module);
		});
		module.q(".tb_repace").addEventListener("click",function(){
			_this.replace(module);
		});
		module.q(".textarea").addEventListener("keyup",function(){
			_this.updateCharacterCounts(module);
		});

		module.getBaseModule().addEventListener("keydown",function(e){
			_this.handleFind(module, e);
		});
		module.q(".tb_replace").addEventListener("click",function(){
			let fs = module.q(".findSpan");
			fs.hidden = !fs.hidden;
		});
	},

	instantiate: function(where){
		where.innerHTML = /*html*/`
			<div class="fs30b textbox">TextBox</div>
			<textarea class="textarea" placeholder="Your text here."></textarea>
			<br/>
			<span class="characterCount">0</span> characters, <span class="wordCount">0</span> words, <span class="lineCount">1</span> lines.
			<br/>
			<input type="button" class="tb_sort" value="Sort lines">
			<input type="button" class="tb_removeDupes" value="Remove duplicate lines">
			<input type="button" class="tb_replace" value="Replace">
			<input type="button" class="tb_toupper" value="Uppercase">
			<input type="button" class="tb_tolower" value="Lowercase">
			<input type="button" class="tb_torand" value="Randomcase">
			<input type="button" class="tb_toinvert" value="Invertcase">
			<br/>
			<span class="findSpan" hidden>
				<span>Replace </span>
				<input type="text" class="replaceInputPattern">
				<span> with </span>
				<input type="text" class="replaceOutputPattern">
				<input type="button" class="tb_repace" value="Go">
				<input type="checkbox" class="regexSearch" checked=true>
				<label for="regexSearch">Regex</label>
			</span>
		`
	},

	registerSettings: function(){
		return [
			{
				"name": "showUpperButton",
				"description": "Display uppercase button",
				"type": "bool",
				"default": true,
			},
			{
				"name": "showLowerButton",
				"description": "Display lowercase button",
				"type": "bool",
				"default": true,
			},
			{
				"name": "showRandomButton",
				"description": "Display randomcase button",
				"type": "bool",
				"default": false,
			},
			{
				"name": "showInvertButton",
				"description": "Display invertcase button",
				"type": "bool",
				"default": false,
			},
			{
				"name": "showRemoveDuplicatesButton",
				"description": "Display remove duplicates button",
				"type": "bool",
				"default": true,
			},
		]
	},

	registerDocumentation: function(){
		return [
			"This is a basic text box. You can then use your browsers spell check without needing to make any network requests.",
			"The characters tells you how many characters you have typed. The words tell you how many words you have typed, a word is defined as non-whitespace characters followed by whitespace.",
			"The sort lines button will sort the lines alphabetically.",
			"The Uppercase, Lowercase, Randomcase, and Invertcase buttons will all change the case of the entered text in various ways.",
			"You can hit ctrl+f to open the find and replace menu. The find and replace menu follows JavaScript regex pattern matching.",
			"In the find and replace, you can use regex. Any groups made in the replace field can be accessed by using `$1` for the first reference and so on.",
		]
	},
});
