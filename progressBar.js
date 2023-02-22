//updates the parent progress bar width of the element passed to it
dashboard.registerModule({
	name: "progressBar",

	updateBar: function(obj){
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
	},

	//updates all of the progess bar widths
	processAllBars: function(){
		let entries = document.querySelectorAll(".pb_entry");
		for(let i=0; i<entries.length; i++){
			this.updateBar(entries[i]);
		}
	},

	addBar: function(obj){
		let _this = this;
		let mod = getModule(obj);

		//create from template
		let element = mod.querySelector("#pb_tmplt").content.cloneNode(true);
		let created = element.querySelector(".pb_entry");

		element.querySelector(".pb_label").value = getSetting(this.name, "defaultName");

		//add bar event listeners
		created.querySelector(".pb_completedNumber").addEventListener("input", function(){
			_this.updateBar(this);
		});
		created.querySelector(".pb_totalNumber").addEventListener("input", function(){
			_this.updateBar(this);
		});
		created.querySelector(".pb_deleteButton").addEventListener("click", function(){
			_this.deleteBar(this);
		});

		//add element to dom
		mod.querySelector("#pb_bars").insertBefore(element, mod.querySelector("#pb_insertButton"));

		return created;
	},

	deleteBar: function(element){
		let bar = getParentOfClass(element, "pb_entry");

		let shouldDelete = true;

		let completed = bar.querySelector(".pb_completedNumber").value;
		let total = bar.querySelector(".pb_totalNumber").value;
		let label = bar.querySelector(".pb_label").value;
		if (completed < total){
			shouldDelete = confirm("This progress bar (" + label + ") is not completed. Are you sure you would like to delete it?");
		}

		if (shouldDelete)
			bar.parentNode.removeChild(bar);
	},

	saveBars: function(obj){
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
	},

	loadBars: function(obj){
		let loadedObj = JSON.parse(localStorage.getItem("pb_bars"));

		if (loadedObj == null)
			return;

		for(let i=0; i<loadedObj.length; i++){
			let newBar = this.addBar(obj);

			newBar.querySelector(".pb_completedNumber").value = loadedObj[i].done;
			newBar.querySelector(".pb_totalNumber").value = loadedObj[i].total;
			newBar.querySelector(".pb_label").value = loadedObj[i].name;
		}

		this.processAllBars();
	},

	//init the progress bars
	init: function(){
		let _this = this;

		let barContainer = document.querySelector("#pb_bars");

		//create module event listeners
		barContainer.addEventListener("click", function(){
			_this.saveBars(this);
		});

		barContainer.addEventListener("keyup", function(){
			_this.saveBars(this);
		})

		document.querySelector("#pb_insertButton").addEventListener("click",function(){
			_this.addBar(this);
		});

		//load from localStorage
		this.loadBars(document.querySelector("#pb_bars"));
	},

	instantiate: function(where){
		where.innerHTML = /*html*/`
			<div class="fs30b" id="progressTracker">Progress Tracker</div>
			<div id="pb_bars">
				<template id="pb_tmplt">
					<span class="pb_entry">
						<input type="number" min=0 class="width6 pb_completedNumber" value=0>
						<span>/</span>
						<input type="number" min=1 class="width6 pb_totalNumber" value=1>
						<span class="bar">
							<input type="text" class="pb_label">
							<span class="progressBar"></span>
						</span>
						<input type="button" class="button pb_deleteButton" value="x">
						<br/>
					</span>
				</template>
				<input type="button" id="pb_insertButton" class="button" value="+">
			</div>
		`
	},

	registerSettings: function(){
		return [
			{
				"name": "defaultName",
				"description": "Default name when a progress bar is created",
				"type": "text",
				"default": "Progress bar",
			},
		]
	},
});
