//updates the parent progress bar width of the element passed to it
function updateBar(obj){
    //get the progressbar entry
    while (obj != document.body && !obj.classList.contains("pb_entry")){
        obj = obj.parentElement;
    }
    //this does nothing other than make the variable name make more sense
    let progressBarEntry = obj;

    //calculate the percent
    let percent = progressBarEntry.querySelector(".pb_completedNumber").value;
    percent /= progressBarEntry.querySelector(".pb_totalNumber").value;
    percent *= 100;

    //clamp number to a valid percent
    if (percent > 100)
        percent = 100;
    if (percent < 0)
        percent = 0;

    //set the width of the bar
    progressBarEntry.querySelector(".progressBar").style.width=percent+"%";
}

//updates all of the progess bar widths
function processAllBars(){
    let entries = document.querySelectorAll(".pb_entry");
    for(let i=0; i<entries.length; i++){
        updateBar(entries[i]);
    }
}

function pb_addBar(){
    //create from template
    let element = document.querySelector("#pb_tmplt").content.cloneNode(true);

    //add element to dom
    document.getElementById("pb_bars").insertBefore(element, document.getElementById("pb_insertButton"));
}
