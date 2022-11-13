//updates the parent progress bar width of the element passed to it
function updateBar(obj){
    //get the progressbar entry
    let progressBarEntry = getParentOfClass(obj, "pb_entry");

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

function pb_addBar(obj){
    let mod = getModule(obj);

    //create from template
    let element = mod.querySelector("#pb_tmplt").content.cloneNode(true);
    let created = element.querySelector(".pb_entry");

    //add element to dom
    mod.querySelector("#pb_bars").insertBefore(element, mod.querySelector("#pb_insertButton"));

    return created;
}

function pb_deleteBar(element){
    let bar = getParentOfClass(element, "pb_entry");
    bar.parentNode.removeChild(bar);
}

function pb_saveBars(obj){
    let mod = getModule(obj);

    let saveObj = [];

    let entries = mod.querySelectorAll(".pb_entry");
    for(let i=0; i<entries.length; i++){
        let curBar = {};

        curBar.done = entries[i].querySelector(".pb_completedNumber").value;
        curBar.total = entries[i].querySelector(".pb_totalNumber").value;
        curBar.name = entries[i].querySelector(".pb_label").value;

        saveObj.push(curBar);
    }

    localStorage.setItem("pb_bars", JSON.stringify(saveObj));

    console.log("saved bars.");
}

function pb_loadBars(obj){
	let loadedObj = JSON.parse(localStorage.getItem("pb_bars"));

	if (loadedObj == null)
		return;

	for(let i=0; i<loadedObj.length; i++){
		let newBar = pb_addBar(obj);
		
        newBar.querySelector(".pb_completedNumber").value = loadedObj[i].done;
        newBar.querySelector(".pb_totalNumber").value = loadedObj[i].total;
        newBar.querySelector(".pb_label").value = loadedObj[i].name;
	}

    processAllBars();
}

//init the progress bars
function pb_init(){
    let barContainer = document.getElementById("pb_bars");

    barContainer.addEventListener("click", function(){
        pb_saveBars(this);
    });

    barContainer.addEventListener("keyup", function(){
        pb_saveBars(this);
    })

    pb_loadBars(document.getElementById("pb_bars"));
}

//load the progressBars when the page loads
if (document.readyState === 'complete') {
	pb_init();
} else {
	window.addEventListener("load", pb_init);
}
