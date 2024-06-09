'use strict';
//updates the parent progress bar width of the element passed to it
dashboard.registerModule({
	name: "progressBar",
	displayName: "Progress Tracker",
	version: "1.0.1",

	updateBar: function(obj){
		//get the progress bar entry
		let progressBarEntry = obj.closest(".entry");

		//calculate the percent
		let percent = progressBarEntry.querySelector(".completedNumber").value;
		percent /= progressBarEntry.querySelector(".totalNumber").value;
		percent *= 100;

		//clamp number to a valid percent
		if (percent > 100)
			percent = 100;
		if (percent < 0)
			percent = 0;

		//set the width of the bar
		progressBarEntry.querySelector(".bar").style.width=percent+"%";
		progressBarEntry.querySelector(".completionPercent").innerHTML = parseFloat(percent).toFixed(2) + "%";
	},

	//updates all of the progress bar widths
	processAllBars: function(module){
		let entries = module.qAll(".entry");
		for(let i=0; i<entries.length; i++){
			this.updateBar(entries[i]);
		}
	},

	addBar: function(obj){
		let _this = this;
		let mod = getModule(obj);

		//create from template
		let element = mod.querySelector(".tmplt").content.cloneNode(true);
		let created = element.querySelector(".entry");

		element.querySelector(".label").value = getSetting(this.name, "defaultName");

		//add bar event listeners
		created.querySelector(".completedNumber").addEventListener("input", function(){
			_this.updateBar(this);
		});
		created.querySelector(".totalNumber").addEventListener("input", function(){
			_this.updateBar(this);
		});
		created.querySelector(".deleteButton").addEventListener("click", function(){
			_this.deleteBar(this, _this);
		});
		created.querySelector(".label").addEventListener("keydown", function(e){
			if(e.key == "ArrowUp") {
				e.preventDefault();
				let bar = this.closest(".entry");
				let input = bar.querySelector(".completedNumber");
				input.value = +input.value + 1;
				_this.updateBar(bar);
				_this.saveBars(this);
			} else if(e.key == "ArrowDown") {
				e.preventDefault();
				let bar = this.closest(".entry");
				let input = bar.querySelector(".completedNumber");
				input.value = +input.value - 1;
				_this.updateBar(bar);
				_this.saveBars(this);
			}
		});

		//add element to dom
		mod.querySelector(".bars").insertBefore(element, mod.querySelector(".insertButton"));

		return created;
	},

	deleteBar: function(element, _this){
		let bar = element.closest(".entry");

		let shouldDelete = true;

		let completed = bar.querySelector(".completedNumber").value;
		let total = bar.querySelector(".totalNumber").value;
		let label = bar.querySelector(".label").value;
		if (completed < total && getSetting(_this.name,"AskOnDeleteUnfinished")){
			shouldDelete = db_confirm("This progress bar (" + label + ") is not completed. Are you sure you would like to delete it?");
		}

		if (shouldDelete)
			bar.parentNode.removeChild(bar);
	},

	saveBars: function(obj){
		let mod = getModule(obj);

		let saveObj = [];

		let entries = mod.querySelectorAll(".entry");
		for(let i=0; i<entries.length; i++){
			let curBar = {};

			curBar.done = entries[i].querySelector(".completedNumber").value;
			curBar.total = entries[i].querySelector(".totalNumber").value;
			curBar.name = entries[i].querySelector(".label").value;

			saveObj.push(curBar);
		}

		localStorage.setItem("pb_bars", JSON.stringify(saveObj));
	},

	loadBars: function(module, obj){
		let loadedObj = JSON.parse(localStorage.getItem("pb_bars"));

		if (loadedObj == null)
			return;

		for(let i=0; i<loadedObj.length; i++){
			let newBar = this.addBar(obj);

			newBar.querySelector(".completedNumber").value = loadedObj[i].done;
			newBar.querySelector(".totalNumber").value = loadedObj[i].total;
			newBar.querySelector(".label").value = loadedObj[i].name;
		}

		this.processAllBars(module);
	},

	//init the progress bars
	init: function(module){
		let _this = this;


		let barContainer = module.q(".bars");

		//create module event listeners
		barContainer.addEventListener("click", function(){
			_this.saveBars(this);
		});

		barContainer.addEventListener("change", function(){
			_this.saveBars(this);
		});

		module.q(".insertButton").addEventListener("click",function(){
			let newBar = _this.addBar(this);
			_this.updateBar(newBar);
		});

		//load from localStorage
		this.loadBars(module, module.q(".bars"));
	},

	instantiate: function(where){
		where.innerHTML = /*html*/`
			<div class="fs30b progressTracker">Progress Tracker</div>
			<div class="bars">
				<template class="tmplt">
					<span class="entry">
						<input type="number" min=0 class="width6 completedNumber" value=0>
						<span>/</span>
						<input type="number" min=1 class="width6 totalNumber" value=1>
						<span class="fullBar">
							<input type="text" class="label">
							<span class="bar"></span>
						</span>
						<span class="completionPercent"></span>
						<input type="button" class="deleteButton" value="X">
						<br/>
					</span>
				</template>
				<input type="button" class="insertButton" value="+">
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
			{
				"name": "AskOnDeleteUnfinished",
				"description": "Prompt for confirmation when deleting an unfinished progress bar",
				"type": "bool",
				"default": true,
			},
		]
	},

	registerDocumentation: function(){
		return [
			"The progress bar will show you how far along you are from completing a task. You can hit the plus button to add a new progress bar.",
			"The first number on a progress bar is how far along the task is. The second number is how many it takes to complete it.",
			"If the first number is less than the second one, the progress bar will show a proportion for how far along the task is.",
			"If the first number is bigger than the second one, the progress bar will show a full completion.",
			"Once you are done with a progress bar, hitting the x button will delete it.",
		]
	},
});
