//updates the character and word counts of the text area
//words are considered any string of non-whitespace seperated by whitespace on either side
function tb_updateCharacterCounts(){
	let input = document.getElementById("textarea").value;
	
	//character count
	document.getElementById("characterCount").innerHTML = input.length;
	
	//word count
	let truncatedInput = input.trim();
	let words = truncatedInput.split(new RegExp(/\s+/));
	
	let wordCount = 0;
	if(truncatedInput!="")
		wordCount = words.length;
	
	document.getElementById("wordCount").innerHTML = wordCount;
}

//sorts all of the lines in the textbox alphabetically (does not ignore case)
function tb_alphabetizeLines(){
	let input = document.getElementById("textarea");
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
}

function tb_toUpper(){
	let input = document.getElementById("textarea");
	input.value = input.value.toUpperCase();
}

function tb_toLower(){
	let input = document.getElementById("textarea");
	input.value = input.value.toLowerCase();
}

function tb_toRandom(){
	let output = "";
	let input = document.getElementById("textarea");
	let text = input.value;
	for(let i=0; i<text.length; i++){
		let number = Math.floor(Math.random() * 2);
		output += (number===0 ? text[i].toLowerCase() : text[i].toUpperCase());
	}
	input.value = output;
}

function tb_toInvert(){
	let output = "";
	let input = document.getElementById("textarea");
	let text = input.value;
	for(let i=0; i<text.length; i++){
		output += ((text[i] >= 'A' && text[i] <= 'Z') ? text[i].toLowerCase() : text[i].toUpperCase());
	}
	input.value = output;
}

function regexEscapeString(input){
	return input.replace
}

function tb_replace(){
	let inputPattern; 
	if (document.getElementById("regexSearch").value)
		inputPattern = new RegExp(document.getElementById("replaceInputPattern").value, 'g');
	else
		inputPattern = document.getElementById("replaceInputPattern").value;

	let outputPattern = document.getElementById("replaceOutputPattern").value;

	let input = document.getElementById("textarea");
	input.value = input.value.replaceAll(inputPattern, outputPattern);
	//todo allow for captures to be used in the output
}