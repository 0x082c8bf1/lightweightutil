dashboard.registerModule({
	name: "textbox",
	displayName: "TextBox",

	_self: null,

	//updates the character and word counts of the text area
	//words are considered any string of non-whitespace seperated by whitespace on either side
	updateCharacterCounts: function(){
		let input = document.querySelector("#textarea").value;

		//character count
		document.querySelector("#characterCount").innerHTML = input.length;

		//word count
		let truncatedInput = input.trim();
		let words = truncatedInput.split(new RegExp(/\s+/));

		let wordCount = 0;
		if(truncatedInput!="")
			wordCount = words.length;

		document.querySelector("#wordCount").innerHTML = wordCount;
	},

	//sorts all of the lines in the textbox alphabetically (does not ignore case)
	alphabetizeLines: function(){
		let input = document.querySelector("#textarea");
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

	toUpper: function(){
		let input = document.querySelector("#textarea");
		input.value = input.value.toUpperCase();
	},

	toLower: function(){
		let input = document.querySelector("#textarea");
		input.value = input.value.toLowerCase();
	},

	toRandom: function(){
		let output = "";
		let input = document.querySelector("#textarea");
		let text = input.value;
		for(let i=0; i<text.length; i++){
			let number = Math.floor(Math.random() * 2);
			output += (number===0 ? text[i].toLowerCase() : text[i].toUpperCase());
		}
		input.value = output;
	},

	toInvert: function(){
		let output = "";
		let input = document.querySelector("#textarea");
		let text = input.value;
		for(let i=0; i<text.length; i++){
			output += ((text[i] >= 'A' && text[i] <= 'Z') ? text[i].toLowerCase() : text[i].toUpperCase());
		}
		input.value = output;
	},

	regexEscapeString: function(input){
		return input.replace
	},

	replace: function(){
		let inputPattern;
		if (document.querySelector("#regexSearch").value)
			inputPattern = new RegExp(document.querySelector("#replaceInputPattern").value, 'g');
		else
			inputPattern = document.querySelector("#replaceInputPattern").value;

		let outputPattern = document.querySelector("#replaceOutputPattern").value;

		let input = document.querySelector("#textarea");
		input.value = input.value.replaceAll(inputPattern, outputPattern);
		//todo allow for captures to be used in the output
	},

	handleFind: function(e){
		if(e.key == 'f' && e.ctrlKey) {
			e.preventDefault();
			let fs = document.querySelector(".findSpan");
			fs.hidden = !fs.hidden;
			if (!fs.hidden)
				document.querySelector("#replaceInputPattern").focus();
			else
				document.querySelector("#textarea").focus();
		}
	},

	init: function(){
		let _this = this;
		document.querySelector(".tb_sort").addEventListener("click",function(){
			_this.alphabetizeLines();
		});
		let uc_button = document.querySelector(".tb_toupper");
		let lc_button = document.querySelector(".tb_tolower");
		let rc_button = document.querySelector(".tb_torand");
		let ic_button = document.querySelector(".tb_toinvert");

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

		//add event listeners
		uc_button.addEventListener("click",function(){
			_this.toUpper();
		});
		lc_button.addEventListener("click",function(){
			_this.toLower();
		});
		rc_button.addEventListener("click",function(){
			_this.toRandom();
		});
		ic_button.addEventListener("click",function(){
			_this.toInvert();
		});
		document.querySelector(".tb_repace").addEventListener("click",function(){
			_this.replace();
		});
		document.querySelector("#textarea").addEventListener("keyup",function(){
			_this.updateCharacterCounts();
		});
		_self.addEventListener("keydown",function(e){
			_this.handleFind(e);
		});
	},

	instantiate: function(where){
		_self = where;

		where.innerHTML = /*html*/`
			<div class="fs30b" id="textbox">TextBox</div>
			<textarea id="textarea" placeholder="Your text here."></textarea>
			<br/>
			<span id="characterCount">0</span> characters, <span id="wordCount">0</span> words.
			<br/>
			<input type="button" class="button tb_sort" value="Sort lines">
			<input type="button" class="button tb_toupper" value="Uppercase">
			<input type="button" class="button tb_tolower" value="Lowercase">
			<input type="button" class="button tb_torand" value="Randomcase">
			<input type="button" class="button tb_toinvert" value="Invertcase">
			<br/>
			<span class="findSpan" hidden>
				<span>Replace </span>
				<input type="text" id="replaceInputPattern">
				<span> with </span>
				<input type="text" id="replaceOutputPattern">
				<input type="button" class="button tb_repace" value="go">
				<input type="checkbox" id="regexSearch" hidden>
				<span hidden>Regex<span>
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
		]
	},

	registerDocumentation: function(){
		return [
			"This is a basic text box. You can then use your browsers spell check without needing to make any network requests.",
			"The characters tells you how many characters you have typed. The words tell you how many words you have typed, a word is defined as non-whitespace characters followed by whitespace.",
			"The sort lines button will sort the lines alphabetically.",
			"The Uppercase, Lowercase, Randomcase, and Invertcase buttons will all change the case of the entered text in various ways.",
			"You can hit ctrl+f to open the find and replace menu. The find and replace menu follows JavaScript regex pattern matching.",
		]
	},
});
