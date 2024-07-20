'use strict';
dashboard.registerModule({
	name: "multitimer",
	displayName: "Multi timer",
	version: "1.0.1",

	createDuration: function(h,m,s){
		const ms = s * 1000 + m * 1000*60 + h*1000*60*60;
		return {hours: h, minutes: m, seconds: s, totalMS: ms};
	},

	//converts a duration in ms to a duration object
	getDurationFromMS: function(ms){
		const MS_PER_SEC = 1000;
		const MS_PER_MIN = MS_PER_SEC*60;
		const MS_PER_HOUR = MS_PER_MIN*60;

		const hours = Math.floor(ms / MS_PER_HOUR);
		ms %= MS_PER_HOUR;

		const minutes = Math.floor(ms / MS_PER_MIN);
		ms %= MS_PER_MIN;

		const seconds = Math.floor(ms / MS_PER_SEC);
		ms %= MS_PER_SEC;

		return this.createDuration(hours, minutes, seconds);
	},

	//converts a duration in ms to a string in HH:MM:SS
	getDurationAsString: function(ms){
		let output = "";

		//handle negative durations
		if(ms<0){
			ms = Math.abs(ms);
			if(ms >= 1000)
				output += "-";
		}

		const dur = this.getDurationFromMS(ms);

		output += dur.hours.toString().padStart(2, "0");
		output += ":";
		output += dur.minutes.toString().padStart(2, "0");
		output += ":";
		output += dur.seconds.toString().padStart(2, "0");

		return output;
	},

	setTimerStatus: function(inst, timer, status) {
		switch(status) {
			case inst.status.INACTIVE:
				timer.querySelector(".time-display").hidden = true;
				timer.querySelector(".time-input").hidden = false;
				timer.querySelector(".start-button").value = "Start";
				timer.querySelector(".time-display").style.color = "white";
				break;
			case inst.status.ACTIVE:
				timer.querySelector(".time-display").hidden = false;
				timer.querySelector(".time-input").hidden = true;
				timer.querySelector(".start-button").value = "Pause";
				timer.querySelector(".time-display").style.color = "white";
				this.checkStartTimerTickInterval(inst);
				break;
			case inst.status.PAUSED:
				timer.querySelector(".time-display").hidden = false;
				timer.querySelector(".time-input").hidden = true;
				timer.querySelector(".start-button").value = "Resume";
				timer.querySelector(".time-display").style.color = "grey";
				this.checkStartTimerTickInterval(inst);
				break;
			case inst.status.RINGING:
				timer.querySelector(".time-display").hidden = false;
				timer.querySelector(".time-input").hidden = true;
				timer.querySelector(".start-button").value = "Reset";
				break;
		}

		timer.status = status;
	},

	tick: function(inst, timer) {
		if (timer.status == inst.status.INACTIVE)
			return;

		//update time display
		let difference = 0;
		if (timer.status == inst.status.ACTIVE || timer.status == inst.status.RINGING) {
			difference = new Date()-timer.startDate;
		}
		const timeRemaining = timer.duration-(difference+timer.msOffset);
		const displayTime = this.getDurationAsString(timeRemaining);
		if (displayTime !== timer.querySelector(".time-display").innerHTML) {
			timer.querySelector(".time-display").innerHTML = displayTime;
		}

		if (timer.status != inst.status.ACTIVE)
			return;

		//start ringing
		if (timeRemaining <= 0) {
			if (!timer.notifSent && getSetting(this.name, "notifyOnRing")){
				new Notification("Multi Timer: " + timer.querySelector(".name").value + " is over.");
				timer.notifSent = true;
			}

			if (inst.numberOfRingingTimers == 0) {
				if (inst.usingAudio) {
					inst.loadedAudio.currentTime = 0;
					const p = inst.loadedAudio.play();
					p.catch(function(){
						db_alert("Multitimer audio failed to play. This is likely because autoplay is disabled in your browser, please enable it or set the volume to 0 to disable audio.");
					});
				}
			}
			inst.numberOfRingingTimers++;
			timer.querySelector(".time-display").style.color = "red";
			this.setTimerStatus(inst, timer, inst.status.RINGING);
		} else {
			timer.notifSent = false;
		}
	},

	resetTimer: function(inst, timer){
		if (timer.status == inst.status.RINGING) {
			inst.numberOfRingingTimers--;
			if (inst.numberOfRingingTimers < 0) {
				error("Invalid number of ringing timers: " + inst.numberOfRingingTimers);
			}
			if (inst.numberOfRingingTimers == 0) {
				if (inst.usingAudio) {
					inst.loadedAudio.currentTime = 0;
					inst.loadedAudio.pause();
				}
			}
		}

		this.setTimerStatus(inst, timer, inst.status.INACTIVE);

		//reset msOffset so resetting a timer that has been paused doesn't resume when started again.
		timer.msOffset = 0;
	},

	//takes a string and tries it's best to assume what was supposed to be typed in as a number
	makeValidNumber: function(input){
		const pattern = /[^\d|^\.]/g;

		return input.replace(pattern, "");
	},

	valuesToDuration: function(hInput, mInput, sInput) {
		let h;

		if (hInput.includes("d")){
			//get the left and right of "d"
			const splitPos = hInput.indexOf("d");
			const lStr = hInput.substring(0,splitPos);
			const rStr = hInput.substring(splitPos+1);

			//convert days and hours to number to numbers
			let dNum = parseFloat(this.makeValidNumber(lStr));
			let hNum = parseFloat(this.makeValidNumber(rStr));

			//handle not putting a number before or after "d"
			dNum = (isNaN(dNum)) ? 0 : dNum;
			hNum = (isNaN(hNum)) ? 0 : hNum;

			//convert to hours
			h = dNum*24 + hNum;
		} else {
			h = this.makeValidNumber(hInput);
		}

		const m = this.makeValidNumber(mInput);
		const s = this.makeValidNumber(sInput);

		return this.createDuration(h ? h : 0, m ? m : 0, s ? s : 0).totalMS;

	},

	startButtonEvent: function(inst, timer) {
		switch(timer.status) {
			case inst.status.INACTIVE:
				{
					//handle hour input
					timer.duration = this.valuesToDuration(timer.querySelector(".h-input").value,
						timer.querySelector(".m-input").value, timer.querySelector(".s-input").value);
					timer.startDate = new Date();
					this.setTimerStatus(inst, timer, inst.status.ACTIVE);
					this.tick(inst, timer);
					break;
				}
			case inst.status.ACTIVE:
				timer.msOffset += new Date()-timer.startDate;
				timer.startDate = null;
				this.setTimerStatus(inst, timer, inst.status.PAUSED);
				break;
			case inst.status.PAUSED:
				timer.startDate = new Date();
				this.setTimerStatus(inst, timer, inst.status.ACTIVE);
				break;
			case inst.status.RINGING:
				this.resetTimer(inst, timer);
				break;
		}
		this.saveAllTimers(inst);
	},

	//start the timerTickInterval if it isn't already
	checkStartTimerTickInterval: function(inst) {
		const _this = this;

		if (inst.timerTickInterval == null) {
			inst.timerTickInterval = setInterval(function(){
				const timers = inst.qAll(".timer");
				for(let i=0; i<timers.length; i++) {
					_this.tick(inst, timers[i]);
				}
			}, 100);
		}
	},

	//setup a new timer element
	initTimer: function(inst, timer) {
		const _this = this;

		timer.querySelector(".start-button").addEventListener("click", function(){
			_this.startButtonEvent(inst, timer);
		});

		timer.querySelector(".x-button").addEventListener("click", function(){
			if (timer.status == inst.status.INACTIVE) {
				timer.remove();
			} else {
				_this.resetTimer(inst, timer);
			}
			_this.saveAllTimers(inst);
		});

		timer.querySelector(".time-input").addEventListener("keydown", function(e){
			if(e.code === "Enter" || e.code === "NumpadEnter"){
				_this.startButtonEvent(inst, timer);
			}
		});
		timer.querySelector(".name").addEventListener("keydown", function(e){
			if(e.code === "Enter" || e.code === "NumpadEnter"){
				_this.startButtonEvent(inst, timer);
			}
		});

		this.checkStartTimerTickInterval(inst);
	},

	//create a timer with specified arguments, and return the timer.
	createTimer: function(inst, msTime, name, status, startDate, msOffset){
		//clone from template
		const timeFragment = inst.q(".timer_tmplt").content.cloneNode(true);
		let timer = document.createElement("div");

		//avoid document fragment shenanigans
		timer.appendChild(timeFragment);
		timer = timer.children[0];
		inst.q(".timers").insertBefore(timer, inst.q(".trailingGroup"));

		timer.querySelector(".name").value = name;

		//set hhmmss
		const duration = this.getDurationFromMS(msTime);
		timer.querySelector(".h-input").value = duration.hours ? duration.hours : "";
		timer.querySelector(".m-input").value = duration.minutes ? duration.minutes : "";
		timer.querySelector(".s-input").value = duration.seconds ? duration.seconds : "";

		this.notifSent = false;//because this is not saved, it will alert you when you start the page.

		//set timer status
		switch(status) {
			case inst.status.INACTIVE:
				timer.msOffset = 0;
				timer.duration = 0;
				timer.startDate = null;
				this.setTimerStatus(inst, timer, status);
				break;
			case inst.status.ACTIVE:
				timer.msOffset = msOffset ? msOffset : 0;
				timer.duration = msTime;
				timer.startDate = startDate ? new Date(startDate) : new Date();
				this.setTimerStatus(inst, timer, status);
				this.tick(inst, timer); //tick to avoid flash of incorrect numbers
				break;
			case inst.status.PAUSED:
				timer.msOffset = msOffset ? msOffset : 0;
				timer.duration = msTime;
				timer.startDate = null;
				timer.querySelector(".time-display").innerHTML = this.getDurationAsString(msTime);
				this.setTimerStatus(inst, timer, status);
				break;
			//if creating a ringing timer, msTime is how long it has been ringing.
			case inst.status.RINGING:
				timer.msOffset = msOffset ? msOffset : 0;
				timer.duration = 0;
				timer.startDate = new Date()-msTime;
				//set to active then tick to make it ring.
				this.setTimerStatus(inst, timer, inst.status.ACTIVE);
				this.tick(inst, timer);
				break;
		}
		this.initTimer(inst, timer);

		return timer;
	},

	//adds a new timer
	addTimer: function(inst){
		const defaultMs = getSetting(this.name, "defaultTime")*1000;
		const name = getSetting(this.name, "defaultName");
		this.createTimer(inst, defaultMs, name, inst.status.INACTIVE);
	},

	//save all of the timers to localStorage
	saveAllTimers: function(inst){
		const obj = [];
		const timers = inst.qAll(".timer");
		for(let i=0; i<timers.length; i++) {
			const oneTimer = {};
			//save internal values
			oneTimer.status = timers[i].status;
			oneTimer.msOffset = timers[i].msOffset;
			oneTimer.startDate = timers[i].startDate;
			oneTimer.duration = timers[i].duration;

			//save user facing values
			oneTimer.hh = timers[i].querySelector(".h-input").value;
			oneTimer.mm = timers[i].querySelector(".m-input").value;
			oneTimer.ss = timers[i].querySelector(".s-input").value;
			oneTimer.name = timers[i].querySelector(".name").value;

			obj.push(oneTimer);
		}

		localStorage.setItem("mt_timers", JSON.stringify(obj));
	},

	//load all of the timers from localStorage
	loadAllTimers: function(inst){
		//get saved timers
		const obj = JSON.parse(localStorage.getItem("mt_timers"));

		//don't try to load if there aren't any timers
		if (obj == null)
			return;

		for(let i=0; i<obj.length; i++) {
			//load ringing timers as active, since they're basically the same thing
			const tempStatus = obj[i].status;
			if (tempStatus == inst.status.RINGING) {
				tempStatus = inst.status.ACTIVE;
			}

			const timer = this.createTimer(inst, obj[i].duration, obj[i].name, tempStatus, obj[i].startDate, obj[i].msOffset);
			if (obj[i].status == inst.status.PAUSED) {
				this.tick(inst, timer);
			}
			timer.querySelector(".h-input").value = obj[i].hh;
			timer.querySelector(".m-input").value = obj[i].mm;
			timer.querySelector(".s-input").value = obj[i].ss;
		}
	},

	//get the sort value given a status
	statusToSortValue: function(inst, status){
		switch(status) {
			case inst.status.INACTIVE: return 2;
			case inst.status.ACTIVE: return 3;
			case inst.status.PAUSED: return 3;
			case inst.status.RINGING: return 1;
		}
	},

	init: function(inst){
		inst.status = {
			INACTIVE: 1,
			ACTIVE: 2,
			PAUSED: 3,
			RINGING: 4,
		}

		//set sound related variables
		let volume = getSetting(this.name, "volume");
		if (volume > 100) volume = 100;
		if (volume < 0) volume = 0;
		inst.usingAudio = false;
		if (volume > 0) {
			inst.loadedAudio = new Audio("pixbay-alarm-clock-short.mp3"); //the audio that is played when ringing
			inst.loadedAudio.loop = true;
			inst.loadedAudio.volume = volume/100;
			inst.usingAudio = true;
		}

		inst.timerTickInterval = null; //the interval set if any timers exist
		inst.numberOfRingingTimers = 0;

		//set timer gap css variable
		const root = inst.getInstanceRoot();
		root.style.setProperty("--timer_gap", getSetting(this.name, "gap") + "px");


		const _this = this;
		inst.q(".insertButton").addEventListener("click",function(){
			_this.addTimer(inst);
			_this.saveAllTimers(inst);
		});

		//show confirmation before reloading/closing the tab when there are active
		window.onbeforeunload = function(e) {
			if (!getSetting(_this.name, "promptOnClose"))
				return;

			//check for active timers
			const timers = inst.qAll(".timer");
			for (let i=0; i<timers.length; i++) {
				if (timers[i].status == inst.status.ACTIVE || timers[i].status == inst.status.RINGING) {
					e.preventDefault();
					return "There are currently timers running, are you sure you would like to exit?";
				}
			}
		}

		//sort button
		inst.q(".sort").addEventListener("click", function(){
			//get timers
			const timers = Array.from(inst.qAll(".timer"));

			//sort in order of ringing; lowest number first, inactive, active/paused; lowest number first
			timers.sort(function(a,b){
				const aSortVal = _this.statusToSortValue(inst, a.status);
				const bSortVal = _this.statusToSortValue(inst, b.status);
				if (aSortVal != bSortVal) return aSortVal - bSortVal;

				const differenceA = new Date()-a.startDate;
				const timeA = a.duration-(differenceA+a.msOffset);
				const differenceB = new Date()-b.startDate;
				const timeB = b.duration-(differenceB+b.msOffset);
				return timeA - timeB;
			});

			//insert sorted timers
			const timerList = inst.q(".timers");
			const trailingGroup = inst.q(".trailingGroup");
			for(let i=0; i<timers.length; i++) {
				timerList.insertBefore(timers[i], trailingGroup);
			}

			_this.saveAllTimers(inst);
		});

		//save if any field on a timer changes
		inst.q(".timers").addEventListener("change", function(){
			_this.saveAllTimers(inst);
		});

		//notifications button
		inst.q(".notifButton").addEventListener("click", function(){
			Notification.requestPermission().then((permission) => {
				if (permission != "granted") {
					db_alert("Timer notifications will not displayed while notifications are not granted.");
				} else {
					this.hidden = true;
				}
			});
		});

		//check if notifications are enabled
		if (getSetting(_this.name, "notifyOnRing") && "Notification" in window &&
			Notification.permission != "granted"){
			inst.q(".notifButton").hidden = false;
		}

		this.loadAllTimers(inst);
	},

	deconstructInstance: function(inst){
		if (inst.usingAudio) {
			inst.loadedAudio.pause();
			inst.loadedAudio.currentTime = 0;
		}
		clearInterval(inst.timerTickInterval);
		inst.timerTickInterval = null;
	},

	instantiate: function(where){
		where.innerHTML = /*html*/`
			<div class="fs30b">Multi timer</div>
			<div class="flex-container timers">
				<template class="timer_tmplt">
					<span class="timer">
						<input type="text" class="name" autocomplete="off"/>
						<input class="x-button" type="button" value="X" autocomplete="off"/>
						<br/>
						<input type="button" class="start-button" value="Start" autocomplete="off"/>
						<span hidden class="time-display"></span>
						<span class="time-input">
							<input class="h-input width2" type="text" placeholder="HH" autocomplete="off"/>
							<span>:</span>
							<input class="m-input width2" type="text" placeholder="MM" autocomplete="off"/>
							<span>:</span>
							<input class="s-input width2" type="text" placeholder="SS" autocomplete="off"/>
						</span>
					</span>
				</template>
				<input type="button" class="notifButton" value="Enable notifications" autocomplete="off" hidden/>
				<span class="trailingGroup">
					<input type="button" class="insertButton" value="+" autocomplete="off"/>
					<input type="button" class="sort" value="Sort" autocomplete="off"/>
				<span>
				</div>
		`
	},

	//returns an array containing a list of functions and an update version to run at
	updates: function(){
		return [
			{ver: "0.9.0", func: function(){
				log("Converting mt_timers to less excessive escaping.");
				const oldSave = localStorage.getItem("mt_timers");
				if (!oldSave) return;
				const firstParse = JSON.parse(oldSave);
				const obj = [];
				for(let i=0; i<firstParse.length; i++){
					obj[i] = JSON.parse(firstParse[i]);
				}
				localStorage.setItem("mt_timers", JSON.stringify(obj));
			}},
			{ver: "1.0.0", func: function(){
				log("Converting status to new save format.");
				const oldSave = localStorage.getItem("mt_timers");
				if (!oldSave) return;
				const obj = JSON.parse(oldSave);

				for(let i=0; i<obj.length; i++) {
					switch(obj[i].state) {
						case "Start":
							obj[i].status = 1;
							break;
						case "Pause":
							obj[i].status = 2;
							break;
						case "Resume":
							obj[i].status = 3;
							break;
						case "Reset":
							obj[i].status = 4;
							break;
					}
					delete obj[i].state;
				}

				localStorage.setItem("mt_timers", JSON.stringify(obj));
			}},
		];
	},

	registerSettings: function(){
		return [
			{
				"name": "defaultName",
				"description": "Default name when a timer is created",
				"type": "text",
				"default": "Timer",
			},
			{
				"name": "promptOnClose",
				"description": "Prompt for confirmation when closing the page",
				"type": "bool",
				"default": false,
			},
			{
				"name": "notifyOnRing",
				"description": "Send a notification when an alarm starts ringing",
				"type": "bool",
				"default": false,
			},
			{
				"name": "defaultTime",
				"description": "The default time when creating a timer in seconds",
				"type": "number",
				"default": 60,
			},
			{
				"name": "volume",
				"description": "Ringer volume percent",
				"type": "number",
				"default": 50,
			},
			{
				"name": "gap",
				"description": "Timer gap pixels",
				"type": "number",
				"default": 40,
			},
		]
	},

	registerDocumentation: function(){
		return [
			"You can hit the + button to create a new timer. Once a timer is created you can type a time limit into the hh:mm:ss fields to set how long the timer will ring in. Once the time is filled out, you can hit the Start button to start the timer.",
			"Once the time is up, the timer will start ringing. If more than one timer is ringing at a time, you will only hear one alarm, all timers must be stopped for the ringing to stop.",
			"While a timer is running, you can click the Pause button to put the timer on hold temporarily, and then hit the Resume button for it to continue.",
			"Hitting the X button while a timer is running will reset the timer, hitting the timer from it's reset state will remove the timer.",
			"If you type a \"d\" into the hh field, the number to the left of the \"d\" will be days, and the number to the right will be hours.",
		]
	},
});
