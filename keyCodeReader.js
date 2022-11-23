dashboard.registerModule({
    name: "keyCode",

    init: function(){
        //add the event listner
        let input = document.querySelector("#keycodeReader");
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
            
            document.querySelector("#keycodeOutput").innerHTML = output;
            document.querySelector("#resetKeyCodeOutput").hidden = false;
        });

        let _this = this;
        document.querySelector("#resetKeyCodeOutput").addEventListener("click", function(){
            _this.resetKeyCodeOutput();
        });
    },

    resetKeyCodeOutput: function(){
        document.querySelector("#keycodeOutput").innerHTML = "";
        document.querySelector("#keycodeReader").value = "";
        document.querySelector("#resetKeyCodeOutput").hidden = true;
    },
});
