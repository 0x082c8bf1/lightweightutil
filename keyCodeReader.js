function initKeyCodeReader(){
    //add the event listner
    let input = document.getElementById("keycodeReader");
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
        
        document.getElementById("keycodeOutput").innerHTML = output;
        document.getElementById("resetKeyCodeOutput").hidden = false;
    });
}

function resetKeyCodeOutput(){
    document.getElementById("keycodeOutput").innerHTML = "";
    document.getElementById("keycodeReader").value = "";
    document.getElementById("resetKeyCodeOutput").hidden = true;
}

//init on load
if (document.readyState === 'complete') {
    initKeyCodeReader();
} else {
    window.addEventListener("load", initKeyCodeReader);
}
