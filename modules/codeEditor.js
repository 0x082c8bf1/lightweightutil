dashboard.registerModule({
	name: "codeEditor",
	displayName: "Code Editor",
	version: "1.0.1",

	evalTextBox: function(module){
		let shouldContinue = true;

		if (getSetting(this.name, "evalWarn"))
			shouldContinue = confirm("Eval can be unsafe, do not use this function unless you know exactly what the code is doing. Would you like to proceed?");

		if(shouldContinue){
			//define functions
			let outputDiv = module.q(".codeEditorOutput");
			//output(str) - prints value below the textbox
			var output = function(value){
				outputDiv.innerHTML += value + "<br/>";
			}

			let input = module.q(".codeEditorTextarea").value;
			//reset output span
			outputDiv.innerHTML = "";
			outputDiv.style.color = "white";

			//eval, catch errors and set output to red
			let returnVal;
			try{
				returnVal = eval(input);
			}catch(error){
				outputDiv.style.color = "red";
				output(error);
			}

			//display the return value
			let retValueSpan = module.q(".codeEditorReturnValue");
			if(returnVal != undefined)
				retValueSpan.innerHTML = "Return value: " + returnVal;
			else
				retValueSpan.innerHTML = "";
		}
	},

	parenWrap: function(module){
		let codeEditor = module.q(".codeEditorTextarea");
		codeEditor.value = "(" + codeEditor.value + ")";
	},

	refreshSaves: function(module, selectNew){
		//create the option elements
		let selector = module.q(".ce_selector");
		let newSelValue;
		if (selectNew){
			newSelValue = "New Script";
		} else {
			newSelValue = module.q(".codeEditorSaveName").value;
		}

		//delete any existing selection
		selector.innerHTML = "";

		//create the "new script" element
		let option = document.createElement("option");
		option.innerHTML = "New Script";
		option.value = "New Script";
		selector.appendChild(option);

		//create all the other elements
		let saves = JSON.parse(localStorage.getItem("CESaves"));
		for (let save in saves){
			option = document.createElement("option");
			option.innerHTML = save;
			option.value = save;
			selector.appendChild(option);
		}

		//restore the selection
		selector.value = newSelValue;
	},

	//saves the currently selected code to local storage
	saveCode: function(module){
		//create the object
		let name = module.q(".codeEditorSaveName").value;
		if (name == "New Script"){
			alert("\"New Script\" is not an allowed save name.");
			return;
		}
		let output = {};
		output[name] = module.q(".codeEditorTextarea").value;

		//append output object to the existing one or create one
		let saves = localStorage.getItem("CESaves");
		if (!saves){
			saves = {};
		} else {
			saves = JSON.parse(saves);
		}

		//save the output
		saves = JSON.stringify(Object.assign(saves, output));
		localStorage.setItem("CESaves", saves);

		//refresh the selection box
		this.refreshSaves(module);
	},

	//loads the selected code from localStorage
	loadCode: function(module, name){
		let obj;
		if (name == "New Script"){
			obj = "";
		} else {
			let save = localStorage.getItem("CESaves");
			obj = JSON.parse(save)[name];
		}

		module.q(".codeEditorSaveName").value = name;
		module.q(".codeEditorTextarea").value = obj;
	},

	jsonBeautify: function(module){
		let codeEditor = module.q(".codeEditorTextarea");
		let outputDiv = module.q(".codeEditorOutput");
		try{
			let obj = JSON.parse(codeEditor.value);
			codeEditor.value = JSON.stringify(obj, null, "\t");
			outputDiv.innerHTML = "";
		}catch(error){
			outputDiv.style.color = "red";
			outputDiv.innerHTML += error + "<br/>";;
		}
	},

	getLines: function(text){
		return text.split("\n");
	},

	getLineFromPos: function(lines, pos){
		let charCount = 0;
		let line = 0;
		while(charCount+lines[line].length < pos){
			charCount += lines[line].length+1;
			line++;
		}
		return line;
	},

	writeFromLines: function(object, lines){
		object.value = "";
		for(let i=0; i<lines.length-1; i++){
			object.value += lines[i] + "\n";
		}
		object.value += lines[lines.length-1];
	},

	init: function (module){
		let codeEditor = module.q(".codeEditorTextarea");

		this.refreshSaves(module, true);

		//add event listeners
		let _this = this;
		codeEditor.addEventListener("keydown", function(e){
			//allow typing tabs without changing the focus
			if(e.code == "Tab"){
				e.preventDefault();

				if(codeEditor.selectionStart == codeEditor.selectionEnd && !e.shiftKey){
					//inline tabbing
					let selectionStart = codeEditor.selectionStart;
					let selectionEnd = codeEditor.selectionEnd;

					let start = codeEditor.value.substring(0, selectionStart);
					let end = codeEditor.value.substring(selectionEnd, codeEditor.value.length);

					codeEditor.value = start + "\t" + end;
					codeEditor.selectionEnd = selectionEnd + 1;
				} else {
					let lines = _this.getLines(codeEditor.value);

					let start = codeEditor.selectionStart;
					let end = codeEditor.selectionEnd;

					let sLine = _this.getLineFromPos(lines, start);
					let eLine = _this.getLineFromPos(lines, end);

					let startOffset = 0;
					let endOffset = 0;
					//modify selected lines
					for(let i=sLine; i<eLine+1; i++){
						if (e.shiftKey){
							if (lines[i][0] == "\t"){
								lines[i] = lines[i].substring(1);
								endOffset--;
								if (i==sLine) startOffset--;
							}
						} else {
							lines[i] = "\t" + lines[i];
							endOffset++;
							if (i==sLine) startOffset++;
						}
					}

					//write lines back out to textarea
					_this.writeFromLines(codeEditor, lines);

					//put the selection back
					codeEditor.selectionStart = start + startOffset;
					codeEditor.selectionEnd = end + endOffset;
				}
			}
			//allow ctrl+d to duplicate the currently selected lines
			else if(e.code == "KeyD" && e.ctrlKey){
				e.preventDefault();
				//calculate the begining and end of the line
				let lastOffset = 0;//fixes issue where selecting the end of the line selects after the newline
				if(codeEditor.value[codeEditor.selectionStart] == "\n"){
					lastOffset = -1
				}
				let lastNewLinePos = codeEditor.selectionStart + lastOffset;
				while(lastNewLinePos>=0 && codeEditor.value[lastNewLinePos] != "\n"){
					lastNewLinePos--;
				}
				lastNewLinePos+=1;//adjust to be after the last newline

				let nextNewLinePos = codeEditor.selectionEnd;
				while(nextNewLinePos<codeEditor.value.length && codeEditor.value[nextNewLinePos] != "\n"){
					nextNewLinePos++;
				}

				let startPos = lastNewLinePos;
				let endPos = nextNewLinePos;

				let start = codeEditor.value.substring(0,endPos);
				let end = codeEditor.value.substring(endPos, codeEditor.value.length);

				let newCursorPos = codeEditor.selectionStart;

				codeEditor.value = start + "\n" + codeEditor.value.substring(startPos, endPos) + end;
				codeEditor.selectionEnd = newCursorPos;
			}else if(e.code == "KeyR" && e.ctrlKey){
				e.preventDefault();
				_this.evalTextBox(module);
			}else if(e.ctrlKey && e.shiftKey && (e.code == "ArrowUp" || e.code == "ArrowDown")){
				e.preventDefault();

				let lines = _this.getLines(codeEditor.value);

				let start = codeEditor.selectionStart;
				let end = codeEditor.selectionEnd;
				let sLine = _this.getLineFromPos(lines, start);
				let eLine = _this.getLineFromPos(lines, end);

				let selOffset = 0;

				if (e.code == "ArrowUp"){
					let prefix = [];
					if (sLine != 0)
						prefix = lines.slice(0, sLine-1);
					let moved = lines.slice(sLine-1, sLine);
					let selected = lines.slice(sLine, eLine+1);
					let suffix = lines.slice(eLine+1);

					if (moved.length > 0)
						selOffset -= moved[0].length+1;

					lines = [].concat(prefix, selected, moved, suffix);
				} else {
					let prefix = lines.slice(0, sLine);
					let selected = lines.slice(sLine, eLine+1);
					let moved = lines.slice(eLine+1, eLine+2);
					let suffix = lines.slice(eLine+2);

					if (moved.length > 0)
						selOffset += moved[0].length+1;

					lines = [].concat(prefix, moved, selected, suffix);
				}

				_this.writeFromLines(codeEditor, lines);
				codeEditor.selectionStart = start + selOffset;
				codeEditor.selectionEnd = end + selOffset;
			}
		});

		module.q(".ce_eval").addEventListener("click", function(){
			_this.evalTextBox(module);
		});
		module.q(".ce_pwrap").addEventListener("click", function(){
			_this.parenWrap(module);
		});
		module.q(".ce_json").addEventListener("click", function(){
			_this.jsonBeautify(module);
		});

		module.q(".saveCode").addEventListener("click", function(){
			_this.saveCode(module);
		});
		module.q(".ce_selector").addEventListener("change", function(){
			let name = module.q(".ce_selector").value
			_this.loadCode(module, name);
		});
		module.q(".deleteSelection").addEventListener("click", function(){
			//confirm deletion
			let name = module.q(".ce_selector").value;
			if (name == "New Script")
				return;
			let del = confirm("Would you like to delete \"" + name + "\"?");
			if (!del)
				return;

			//delete the save
			let save = JSON.parse(localStorage.getItem("CESaves"));
			delete save[name];
			localStorage.setItem("CESaves", JSON.stringify(save));

			_this.refreshSaves(module, true);
		});
	},

	instantiate: function(where){
		where.innerHTML = /*html*/`
			<div class="fs30b codeEditor">Code Editor</div>
			<textarea class="codeEditorTextarea" tabIndex="-1" placeholder="Your code here." style="white-space: pre;"></textarea>
			<br/>
			<abbr title="Use output('value') to write to the output. The return value is the return value of the last executed statement.">
				<input type="button" class="ce_eval" value="JS eval"/>
			</abbr>
			<input type="button" class="ce_pwrap" value="Wrap in ()"/>
			<input type="button" class="ce_json" value="JSON beautify"/>
			<br/>
			<span class="codeEditorOutput"></span>
			<input type="button" class="saveCode" value="Save"/>
			<input type="text" class="codeEditorSaveName"/>
			<select class="ce_selector"></select>
			<input type="button" class="deleteSelection" value="Delete selected">
			<br/>
			<span class="codeEditorReturnValue"></span>
		`
	},

	registerSettings: function(){
		return [
			{
				"name": "evalWarn",
				"description": "Display warning when running eval",
				"type": "bool",
				"default": true,
			},
		]
	},

	registerDocumentation: function(){
		return [
			"The code editor is a textbox designed for code.",
			"Hitting tab will type a tab instead of moving to the next element. If you hit tab or shift+tab with a selection, it will indent or deindent multiple lines respectively.",
			"Hitting ctrl+d will duplicate the currently selected line(s).",
			"If you hit ctrl+shift+up/down it will move the selected line(s) up or down.",
			"The wrap in parenthesis button will put the entire input inside of parenthesis.",
			"The Eval button, or hitting ctrl+r will evaluate the inputted code as if it was JavaScript.",
			"You can use output(string) to print output below the code editor.",
			"The return value of the last statement executed will be shown in the return value section.",
			"The JSON beautify button will beautify JSON that is inside of the code editor.",
			"You can save and load code editor scripts using the save options.",
			"Hitting save will save the current script with the name in the textbox, overwriting any script with that name already.",
			"Hitting \"Delete selected\" will delete the script selected in the drop down menu.",
		]
	},
});
