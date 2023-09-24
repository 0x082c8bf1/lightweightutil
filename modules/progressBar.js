//updates the parent progress bar width of the element passed to it
dashboard.registerModule({
	name: "progressBar",
	displayName: "Progress Tracker",

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
		progressBarEntry.querySelector(".completionPercent").innerHTML = parseFloat(percent).toFixed(2) + "%"
	},

	//updates all of the progess bar widths
	processAllBars: function(module){
		let entries = module.qAll(".pb_entry");
		for(let i=0; i<entries.length; i++){
			this.updateBar(entries[i]);
		}
	},

	addBar: function(obj){
		let _this = this;
		let mod = getModule(obj);

		//create from template
		let element = mod.querySelector(".pb_tmplt").content.cloneNode(true);
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
			_this.deleteBar(this, _this);
		});
		created.querySelector(".pb_label").addEventListener("keydown", function(e){
			if(e.key == "ArrowUp") {
				e.preventDefault();
				let bar = getParentOfClass(this, "pb_entry");
				let input = bar.querySelector(".pb_completedNumber");
				input.value = +input.value + 1;
				_this.updateBar(bar);
				_this.saveBars(this);
			} else if(e.key == "ArrowDown") {
				e.preventDefault();
				let bar = getParentOfClass(this, "pb_entry");
				let input = bar.querySelector(".pb_completedNumber");
				input.value = +input.value - 1;
				_this.updateBar(bar);
				_this.saveBars(this);
			}
		});

		//add element to dom
		mod.querySelector(".pb_bars").insertBefore(element, mod.querySelector(".pb_insertButton"));

		return created;
	},

	deleteBar: function(element, _this){
		let bar = getParentOfClass(element, "pb_entry");

		let shouldDelete = true;

		let completed = bar.querySelector(".pb_completedNumber").value;
		let total = bar.querySelector(".pb_totalNumber").value;
		let label = bar.querySelector(".pb_label").value;
		if (completed < total && getSetting(_this.name,"AskOnDeleteUnfinished")){
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

	loadBars: function(module, obj){
		let loadedObj = JSON.parse(localStorage.getItem("pb_bars"));

		if (loadedObj == null)
			return;

		for(let i=0; i<loadedObj.length; i++){
			let newBar = this.addBar(obj);

			newBar.querySelector(".pb_completedNumber").value = loadedObj[i].done;
			newBar.querySelector(".pb_totalNumber").value = loadedObj[i].total;
			newBar.querySelector(".pb_label").value = loadedObj[i].name;
		}

		this.processAllBars(module);
	},

	//init the progress bars
	init: function(module){
		let _this = this;


		let barContainer = module.q(".pb_bars");

		//create module event listeners
		barContainer.addEventListener("click", function(){
			_this.saveBars(this);
		});

		barContainer.addEventListener("change", function(){
			_this.saveBars(this);
		})

		module.q(".pb_insertButton").addEventListener("click",function(){
			let newBar = _this.addBar(this);
			_this.updateBar(newBar);
		});

		//load from localStorage
		this.loadBars(module, module.q(".pb_bars"));
	},

	instantiate: function(where){
		where.innerHTML = /*html*/`
			<div class="fs30b progressTracker">Progress Tracker</div>
			<div class="pb_bars">
				<template class="pb_tmplt">
					<span class="pb_entry">
						<input type="number" min=0 class="width6 pb_completedNumber" value=0>
						<span>/</span>
						<input type="number" min=1 class="width6 pb_totalNumber" value=1>
						<span class="bar">
							<input type="text" class="pb_label">
							<span class="progressBar"></span>
						</span>
						<span class="completionPercent"></span>
						<input type="button" class="pb_deleteButton" value="x">
						<br/>
					</span>
				</template>
				<input type="button" class="pb_insertButton" value="+">
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
				"default": true
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
