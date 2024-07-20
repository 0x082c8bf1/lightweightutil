'use strict';
dashboard.registerModule({
	name: "textbox",
	displayName: "TextBox",
	version: "1.0.1",

	//updates the character and word counts of the text area
	//words are considered any string of non-whitespace separated by whitespace on either side
	updateCharacterCounts: function(inst){
		const input = inst.q(".textarea").value;

		//character count
		inst.q(".characterCount").innerHTML = input.length;

		//word count
		const truncatedInput = input.trim();
		const words = truncatedInput.split(new RegExp(/\s+/));

		let wordCount = 0;
		if(truncatedInput != "")
			wordCount = words.length;

		inst.q(".wordCount").innerHTML = wordCount;

		const lines = input.split("\n").length;
		inst.q(".lineCount").innerHTML = lines;
	},

	//sorts all of the lines in the textbox alphabetically (does not ignore case)
	alphabetizeLines: function(inst){
		const input = inst.q(".textarea");
		const lines = input.value.split("\n");
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

	toUpper: function(inst){
		const input = inst.q(".textarea");
		input.value = input.value.toUpperCase();
	},

	toLower: function(inst){
		const input = inst.q(".textarea");
		input.value = input.value.toLowerCase();
	},

	toRandom: function(inst){
		let output = "";
		const input = inst.q(".textarea");
		const text = input.value;
		for(let i=0; i<text.length; i++){
			const number = Math.floor(Math.random() * 2);
			output += (number===0 ? text[i].toLowerCase() : text[i].toUpperCase());
		}
		input.value = output;
	},

	toInvert: function(inst){
		let output = "";
		const input = inst.q(".textarea");
		const text = input.value;
		for(let i=0; i<text.length; i++){
			output += ((text[i] >= 'A' && text[i] <= 'Z') ? text[i].toLowerCase() : text[i].toUpperCase());
		}
		input.value = output;
	},

	removeDuplicateLines: function(inst){
		const textbox = inst.q(".textarea");
		const lines = textbox.value.split("\n");
		const outputArr = [];

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
		this.updateCharacterCounts(inst);
	},

	replace: function(inst){
		let inputPattern, outputPattern;
		const input = inst.q(".textarea");

		//regex matching
		if (inst.q(".regexSearch").checked) {
			inputPattern = new RegExp(inst.q(".replaceInputPattern").value, 'g');
			try {
				const data = "[\"" + inst.q(".replaceOutputPattern").value + "\"]";
				outputPattern = JSON.parse(data)[0];
			} catch (e) {
				return;
			}
			input.value = input.value.replace(inputPattern, outputPattern);
		} else {
			//plaintext matching
			inputPattern = inst.q(".replaceInputPattern").value;
			outputPattern = inst.q(".replaceOutputPattern").value;
			input.value = input.value.replaceAll(inputPattern, outputPattern);
		}
	},

	handleFind: function(inst, e){
		if(e.key == 'f' && e.ctrlKey) {
			e.preventDefault();

			const fs = inst.q(".findSpan");
			const searching = document.activeElement.closest(".findSpan");

			if (fs.hidden || searching)
				fs.hidden = !fs.hidden;

			if (!fs.hidden) {
				inst.q(".replaceInputPattern").focus();
			} else {
				inst.q(".textarea").focus();
			}
		}
	},

	init: function(inst){
		const _this = this;
		inst.q(".tb_sort").addEventListener("click",function(){
			_this.alphabetizeLines(inst);
		});
		const uc_button = inst.q(".tb_toupper");
		const lc_button = inst.q(".tb_tolower");
		const rc_button = inst.q(".tb_torand");
		const ic_button = inst.q(".tb_toinvert");
		const rd_button = inst.q(".tb_removeDupes");

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
			_this.toUpper(inst);
		});
		lc_button.addEventListener("click",function(){
			_this.toLower(inst);
		});
		rc_button.addEventListener("click",function(){
			_this.toRandom(inst);
		});
		ic_button.addEventListener("click",function(){
			_this.toInvert(inst);
		});
		rd_button.addEventListener("click",function(){
			_this.removeDuplicateLines(inst);
		});
		inst.q(".tb_repace").addEventListener("click",function(){
			_this.replace(inst);
		});
		inst.q(".textarea").addEventListener("keyup",function(){
			_this.updateCharacterCounts(inst);
		});

		inst.getInstanceRoot().addEventListener("keydown",function(e){
			_this.handleFind(inst, e);
		});
		inst.q(".tb_replace").addEventListener("click",function(){
			const fs = inst.q(".findSpan");
			fs.hidden = !fs.hidden;
		});

		//apply labels
		const regexId = "regexSearch" + inst.getId();
		inst.q(".regexSearch").id = regexId;
		inst.q(".regexLabel").setAttribute("for", regexId);
	},

	instantiate: function(where){
		where.innerHTML = /*html*/`
			<div class="fs30b textbox">TextBox</div>
			<textarea class="textarea" placeholder="Your text here."></textarea>
			<br/>
			<span><span class="characterCount">0</span> characters, <span class="wordCount">0</span> words, <span class="lineCount">1</span> lines.</span>
			<br/>
			<input type="button" class="tb_sort" value="Sort lines" autocomplete="off"/>
			<input type="button" class="tb_removeDupes" value="Remove duplicate lines" autocomplete="off"/>
			<input type="button" class="tb_replace" value="Replace" autocomplete="off"/>
			<input type="button" class="tb_toupper" value="Uppercase" autocomplete="off"/>
			<input type="button" class="tb_tolower" value="Lowercase" autocomplete="off"/>
			<input type="button" class="tb_torand" value="Randomcase" autocomplete="off"/>
			<input type="button" class="tb_toinvert" value="Invertcase" autocomplete="off"/>
			<br/>
			<span class="findSpan" hidden>
				<span>Replace </span>
				<input type="text" class="replaceInputPattern" autocomplete="off"/>
				<span> with </span>
				<input type="text" class="replaceOutputPattern" autocomplete="off"/>
				<input type="button" class="tb_repace" value="Go" autocomplete="off"/>
				<input type="checkbox" class="regexSearch" checked=true autocomplete="off"/>
				<label class="regexLabel">Regex</label>
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
