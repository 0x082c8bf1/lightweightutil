'use strict';
//updates the parent progress bar width of the element passed to it
dashboard.registerModule({
	name: "progressBar",
	displayName: "Progress Tracker",
	version: "1.0.1",

	updateBar: function(obj){
		//get the progress bar entry
		const progressBarEntry = obj.closest(".entry");

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
		progressBarEntry.querySelector(".completionPercent").textContent = parseFloat(percent).toFixed(2) + "%";
	},

	//updates all of the progress bar widths
	processAllBars: function(inst){
		const entries = inst.qAll(".entry");
		for(let i=0; i<entries.length; i++){
			this.updateBar(entries[i]);
		}
	},

	addBar: function(inst){
		const _this = this;

		//create from template
		const element = cloneTemplate(inst.q(".tmplt"));
		const created = element.querySelector(".entry");

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
			if(e.key === "ArrowUp") {
				e.preventDefault();
				const bar = this.closest(".entry");
				const input = bar.querySelector(".completedNumber");
				input.value = +input.value + 1;
				_this.updateBar(bar);
				_this.saveBars(inst);
			} else if(e.key === "ArrowDown") {
				e.preventDefault();
				const bar = this.closest(".entry");
				const input = bar.querySelector(".completedNumber");
				input.value = +input.value - 1;
				_this.updateBar(bar);
				_this.saveBars(inst);
			}
		});

		//add element to dom
		inst.q(".bars").insertBefore(element, inst.q(".insertButton"));

		return created;
	},

	deleteBar: function(element, _this){
		const bar = element.closest(".entry");

		let shouldDelete = true;

		const completed = bar.querySelector(".completedNumber").value;
		const total = bar.querySelector(".totalNumber").value;
		const label = bar.querySelector(".label").value;
		if (completed < total && getSetting(_this.name,"AskOnDeleteUnfinished")){
			shouldDelete = db_confirm("This progress bar (" + label + ") is not completed. Are you sure you would like to delete it?");
		}

		if (shouldDelete)
			bar.parentNode.removeChild(bar);
	},

	saveBars: function(inst){
		const saveObj = [];

		const entries = inst.qAll(".entry");
		for(let i=0; i<entries.length; i++){
			const curBar = {};

			curBar.done = entries[i].querySelector(".completedNumber").value;
			curBar.total = entries[i].querySelector(".totalNumber").value;
			curBar.name = entries[i].querySelector(".label").value;

			saveObj.push(curBar);
		}

		localStorage.setItem("pb_bars", JSON.stringify(saveObj));
	},

	loadBars: function(inst){
		const loadedObj = JSON.parse(localStorage.getItem("pb_bars"));

		if (loadedObj == null)
			return;

		for(let i=0; i<loadedObj.length; i++){
			const newBar = this.addBar(inst);

			newBar.querySelector(".completedNumber").value = loadedObj[i].done;
			newBar.querySelector(".totalNumber").value = loadedObj[i].total;
			newBar.querySelector(".label").value = loadedObj[i].name;
		}

		this.processAllBars(inst);
	},

	//init the progress bars
	init: function(inst){
		const _this = this;

		const barContainer = inst.q(".bars");

		//create event listeners
		barContainer.addEventListener("click", function(){
			_this.saveBars(inst);
		});

		barContainer.addEventListener("change", function(){
			_this.saveBars(inst);
		});

		inst.q(".insertButton").addEventListener("click",function(){
			const newBar = _this.addBar(inst);
			_this.updateBar(newBar);
		});

		//load from localStorage
		this.loadBars(inst);
	},

	instantiate: function(where){
		setInnerHTML(where, /*html*/`
			<div class="fs30b progressTracker">Progress Tracker</div>
			<div class="bars">
				<template class="tmplt">
					<span class="entry">
						<input type="number" min=0 class="width6 completedNumber" value=0 />
						<span>/</span>
						<input type="number" min=1 class="width6 totalNumber" value=1 />
						<span class="fullBar">
							<input type="text" class="label"/>
							<span class="bar"></span>
						</span>
						<span class="completionPercent"></span>
						<input type="button" class="deleteButton" value="X"/>
						<br/>
					</span>
				</template>
				<input type="button" class="insertButton" value="+"/>
			</div>
		`);
	},

	getStyle: function(){
		return /*css*/`
			.progressBar .fullBar {
				width: calc(100% - 16rem);
				max-width: 45rem;
				height: 20px;
				background-color: var(--lw-white);
				display: inline-block;
				vertical-align: bottom;
				margin-top: 5px;
				position: relative;
			}

			.progressBar .bar {
				height: 100%;
				background-color: green;
				display: inline-block;
			}

			.progressBar .width6 {
				width: 6ch;
			}

			.progressBar .label {
				height: 20px;
				background: transparent;
				border: none;
				color: black;
				width: calc(100% - 0.25rem);
				position: absolute;
				padding-right: 0px;
				padding-top: 0px;
				padding-bottom: 0px;
				padding-left: 0.25rem;
			}

			.progressBar .insertButton {
				width: 40px;
				height: 40px;
				font-size: 30px;
				line-height: 30px;
				margin-top: 10px;
				margin-bottom: 10px;
			}
		`;
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
