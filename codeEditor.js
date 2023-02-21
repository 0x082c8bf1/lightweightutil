dashboard.registerModule({
	name: "codeEditor",

	evalTextBox: function(){
		let shouldContinue = confirm("Eval can be unsafe, do not use this function unless you know exactly what the code is doing. Would you like to proceed?");

		if(shouldContinue){
			//define functions
			let outputDiv = document.querySelector("#codeEditorOutput");
			//output(str) - prints str below the textbox
			var output = function(value){
				outputDiv.innerHTML += value + "<br/>";
			}

			let input = document.querySelector("#codeEditorTextarea").value;
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
			let retValueSpan = document.querySelector("#codeEditorReturnValue");
			if(returnVal != undefined)
				retValueSpan.innerHTML = "Return value: " + returnVal;
			else
				retValueSpan.innerHTML = "";
		}
	},

	init: function (){
		let codeEditor = document.querySelector("#codeEditorTextarea");
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

					let lines = codeEditor.value.split("\n");

					//normalize selection
					let start = codeEditor.selectionStart;
					let end = codeEditor.selectionEnd;
					let swapSel = false;
					if (start > end){
						let temp = start;
						start = end;
						end = temp;
						swapSel = true;
					}

					//find begining line
					let charCount = 0;
					let line = 0;
					while(charCount+lines[line].length < start){
						charCount += lines[line].length+1;
						line++;
					}

					//find end line
					let echarCount = 0;
					let eline = 0;
					while(echarCount+lines[eline].length < end){
						echarCount += lines[eline].length+1;
						eline++;
					}

					let startOffset = 0;
					let endOffset = 0;
					//modify selected lines
					for(let i=line; i<eline+1; i++){
						if (e.shiftKey){
							if (lines[i][0] == "\t"){
								lines[i] = lines[i].substring(1);
								endOffset--;
								if (i==line) startOffset--;
							}
						}else{
							lines[i] = "\t" + lines[i];
							endOffset++;
							if (i==line) startOffset++;
						}
					}

					//write lines back out to textarea
					codeEditor.value = "";
					for(let i=0; i<lines.length; i++){
						codeEditor.value += lines[i] + "\n";
					}
					codeEditor.value = codeEditor.value.substring(0, codeEditor.value.length-1);

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

				//add brackets around the selected line
				/*
				codeEditor.value = codeEditor.value.substring(0,lastNewLinePos) + "[" +
					codeEditor.value.substring(lastNewLinePos, nextNewLinePos) + "]" + codeEditor.value.substring(nextNewLinePos, codeEditor.value.length);
				*/

				//duplicate the line right after the current line
				codeEditor.value = start + "\n" + codeEditor.value.substring(startPos, endPos) + end;
				codeEditor.selectionEnd = newCursorPos;
			}else if(e.code == "KeyR" && e.ctrlKey){
				e.preventDefault();
				_this.evalTextBox();
			}
		});

		//add event listeners
		let _this = this;
		document.querySelector(".ce_eval").addEventListener("click", function(){
			_this.evalTextBox();
		});
		document.querySelector(".ce_pwrap").addEventListener("click", function(){
			_this.parenWrap();
		});
	},

	instantiate: function(where){
		where.innerHTML = /*html*/`
			<div class="fs30b" id="codeEditor">Code Editor</div>
			<textarea id="codeEditorTextarea" tabIndex="-1" placeholder="Your code here."></textarea>
			<br/>
			<abbr title="Use output('value') to write to the output. The return value is the return value of the last executed statement.">
				<input type="button" class="button ce_eval" value="JS eval"/>
			</abbr>
			<input type="button" class="button ce_pwrap" value="Wrap in ()"/>
			<br/>
			<span id="codeEditorOutput"></span>
			<br/>
			<span id="codeEditorReturnValue"></span>
		`
	},

	parenWrap: function (){
		let codeEditor = document.querySelector("#codeEditorTextarea");
		codeEditor.value = "(" + codeEditor.value + ")";
	},
});
