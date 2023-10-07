dashboard.registerModule({
	name: "multitimer",
	displayName: "Multi timer",

	createDuration: function(h,m,s){
		let ms = s * 1000 + m * 1000*60 + h*1000*60*60;
		return {hours: h, minutes: m, seconds: s, totalMS: ms};
	},

	//converts a duration in ms to a duration object
	getDurationFromMS: function(ms){
		const MS_PER_SEC = 1000;
		const MS_PER_MIN = MS_PER_SEC*60;
		const MS_PER_HOUR = MS_PER_MIN*60;

		let hours = Math.floor(ms / MS_PER_HOUR);
		ms %= MS_PER_HOUR;

		let minutes = Math.floor(ms / MS_PER_MIN);
		ms %= MS_PER_MIN;

		let seconds = Math.floor(ms / MS_PER_SEC);
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

		let dur = this.getDurationFromMS(ms);

		output += dur.hours.toString().padStart(2, "0");
		output += ":";
		output += dur.minutes.toString().padStart(2, "0");
		output += ":";
		output += dur.seconds.toString().padStart(2, "0");

		return output;
	},

	setTimerStatus: function(module, timer, status) {
		switch(status) {
			case module.status.INACTIVE:
				timer.querySelector(".time-display").hidden = true;
				timer.querySelector(".time-input").hidden = false;
				timer.querySelector(".start-button").value = "Start";
				timer.querySelector(".time-display").style.color = "white";
				break;
			case module.status.ACTIVE:
				timer.querySelector(".time-display").hidden = false;
				timer.querySelector(".time-input").hidden = true;
				timer.querySelector(".start-button").value = "Pause";
				this.checkStartTimerTickInterval(module);
				break;
			case module.status.PAUSED:
				timer.querySelector(".time-display").hidden = false;
				timer.querySelector(".time-input").hidden = true;
				timer.querySelector(".start-button").value = "Resume";
				this.checkStartTimerTickInterval(module);
				break;
			case module.status.RINGING:
				timer.querySelector(".time-display").hidden = false;
				timer.querySelector(".time-input").hidden = true;
				timer.querySelector(".start-button").value = "Reset";
				break;
		}

		timer.status = status;
	},

	tick: function(module, timer) {
		if (timer.status == module.status.INACTIVE)
			return;

		//update time display
		let difference = 0;
		if (timer.status == module.status.ACTIVE || timer.status == module.status.RINGING) {
			difference = new Date()-timer.startDate;
		}
		let timeRemaining = timer.duration-(difference+timer.msOffset);
		timer.querySelector(".time-display").innerHTML = this.getDurationAsString(timeRemaining);

		if (timer.status != module.status.ACTIVE)
			return;

		//start ringing
		if (timeRemaining <= 0) {
			if (!timer.notifSent && getSetting(this.name, "notifyOnRing")){
				new Notification("Multi Timer: " + timer.querySelector(".mt_name").value + " is over.");
				timer.notifSent = true;
			}

			if (module.numberOfRingingTimers == 0) {
				if (module.usingAudio) {
					module.loadedAudio.currentTime = 0;
					module.loadedAudio.play();
				}
			}
			module.numberOfRingingTimers++;
			timer.querySelector(".time-display").style.color = "red";
			this.setTimerStatus(module, timer, module.status.RINGING);
		} else {
			timer.notifSent = false;
		}
	},

	resetTimer: function(module, timer){
		module.numberOfRingingTimers--;
		if (module.numberOfRingingTimers <= 0) {
			if (module.usingAudio) {
				module.loadedAudio.currentTime = 0;
				module.loadedAudio.pause();
			}
		}
		this.setTimerStatus(module, timer, module.status.INACTIVE);

		//reset msOffset so resetting a timer that has been paused doesn't resume when started again.
		timer.msOffset = 0;
	},

	//takes a string and tries it's best to assume what was supposed to be typed in as a number
	makeValidNumber: function(input){
		let pattern = /[^\d|^\.]/g;

		return input.replace(pattern, "");
	},

	startButtonEvent: function(module, timer) {
		switch(timer.status) {
			case module.status.INACTIVE:
				{
					//handle hour input
					let hInput = timer.querySelector(".h-input").value;
					let h;

					if (hInput.includes("d")){
						//get the left and right of "d"
						let splitPos = hInput.indexOf("d");
						let lStr = hInput.substring(0,splitPos);
						let rStr = hInput.substring(splitPos+1);

						//convert days and hours to number to numbers
						let dNum = parseFloat(this.makeValidNumber(lStr));
						let hNum = parseFloat(this.makeValidNumber(rStr));

						//handle not putting a number before or after "d"
						dNum = (isNaN(dys)) ? 0 : dNum;
						hNum = (isNaN(hrs)) ? 0 : hNum;

						//convert to hours
						h = dNum*24 + hNum;
					} else {
						h = this.makeValidNumber(hInput);
					}

					let m = this.makeValidNumber(timer.querySelector(".m-input").value);
					let s = this.makeValidNumber(timer.querySelector(".s-input").value);

					timer.duration = this.createDuration(h ? h : 0, m ? m : 0, s ? s : 0).totalMS;
					timer.startDate = new Date();
					this.setTimerStatus(module, timer, module.status.ACTIVE);
					this.tick(module, timer);
					break;
				}
			case module.status.ACTIVE:
				timer.msOffset += new Date()-timer.startDate;
				timer.startDate = null;
				this.setTimerStatus(module, timer, module.status.PAUSED);
				break;
			case module.status.PAUSED:
				timer.startDate = new Date();
				this.setTimerStatus(module, timer, module.status.ACTIVE);
				break;
			case module.status.RINGING:
				this.resetTimer(module, timer);
				break;
		}
		this.saveAllTimers(module);
	},

	//start the TimerTickInterval if it isn't already
	checkStartTimerTickInterval: function(module) {
		let _this = this;

		if (module.timerTickInterval == null) {
			module.timerTickInterval = setInterval(function(){
				let timers = module.qAll(".timer");
				for(let i=0; i<timers.length; i++) {
					_this.tick(module, timers[i]);
				}
			}, 100);
		}
	},

	//setup a new timer element
	initTimer: function(module, timer) {
		let _this = this;

		timer.querySelector(".start-button").addEventListener("click", function(){
			_this.startButtonEvent(module, timer);
		});

		timer.querySelector(".x-button").addEventListener("click", function(){
			if (timer.status == module.status.INACTIVE) {
				timer.remove();
			} else {
				_this.resetTimer(module, timer);
			}
			_this.saveAllTimers(module);
		});

		timer.addEventListener("keydown", function(e){
			if(e.code == "Enter" || e.code == "NumpadEnter"){
				_this.startButtonEvent(module, this);
			}
		});

		this.checkStartTimerTickInterval(module);
	},

	//create a timer with specified arguments, and return the timer.
	createTimer: function(module, msTime, name, status, startDate, msOffset){
		//clone from template
		let timerFrag = module.q(".timer_tmplt").content.cloneNode(true);
		let timer = document.createElement("div");

		//avoid document fragment shenanigans
		timer.appendChild(timerFrag);
		timer = timer.children[0];
		module.q(".timers").insertBefore(timer, module.q(".mt_insertButton"));

		timer.querySelector(".mt_name").value = name;

		//set hhmmss
		let duration = this.getDurationFromMS(msTime);
		timer.querySelector(".h-input").value = duration.hours ? duration.hours : "";
		timer.querySelector(".m-input").value = duration.minutes ? duration.minutes : "";
		timer.querySelector(".s-input").value = duration.seconds ? duration.seconds : "";

		this.notifSent = false;//because this is not saved, it will alert you when you start the page.

		//set timer status
		switch(status) {
			case module.status.INACTIVE:
				timer.msOffset = 0;
				timer.duration = 0;
				timer.startDate = null;
				this.setTimerStatus(module, timer, status);
				break;
			case module.status.ACTIVE:
				timer.msOffset = msOffset ? msOffset : 0;
				timer.duration = msTime;
				timer.startDate = startDate ? new Date(startDate) : new Date();
				this.setTimerStatus(module, timer, status);
				this.tick(module, timer); //tick to avoid flash of incorrect numbers
				break;
			case module.status.PAUSED:
				timer.msOffset = msOffset ? msOffset : 0;
				timer.duration = msTime;
				timer.startDate = null;
				timer.querySelector(".time-display").innerHTML = this.getDurationAsString(msTime);
				this.setTimerStatus(module, timer, status);
				break;
			//if creating a ringing timer, msTime is how long it has been ringing.
			case module.status.RINGING:
				timer.msOffset = msOffset ? msOffset : 0;
				timer.duration = 0;
				timer.startDate = new Date()-msTime;
				//set to active then tick to make it ring.
				this.setTimerStatus(module, timer, module.status.ACTIVE);
				this.tick(module, timer);
				break;
		}
		this.initTimer(module, timer);

		return timer;
	},

	//adds a new timer
	addTimer: function(module){
		let defaultMs = getSetting(this.name, "defaultTime")*1000;
		let name = getSetting(this.name, "defaultName");
		this.createTimer(module, defaultMs, name, module.status.INACTIVE);
	},

	//save all of the timers to localStorage
	saveAllTimers: function(module){
		let obj = [];
		let timers = module.qAll(".timer");
		for(let i=0; i<timers.length; i++) {
			let oneTimer = {};
			//save internal values
			oneTimer.status = timers[i].status;
			oneTimer.msOffset = timers[i].msOffset;
			oneTimer.startDate = timers[i].startDate;
			oneTimer.duration = timers[i].duration;

			//save user facing values
			oneTimer.hh = timers[i].querySelector(".h-input").value;
			oneTimer.mm = timers[i].querySelector(".m-input").value;
			oneTimer.ss = timers[i].querySelector(".s-input").value;
			oneTimer.name = timers[i].querySelector(".mt_name").value;

			obj.push(oneTimer);
		}

		localStorage.setItem("mt_timers", JSON.stringify(obj));
	},

	//load all of the timers from localStorage
	loadAllTimers: function(module){
		//get saved timers
		let obj = JSON.parse(localStorage.getItem("mt_timers"));

		//don't try to load if there aren't any timers
		if (obj == null)
			return;

		for(let i=0; i<obj.length; i++) {
			//load ringing timers as active, since they're basically the same thing
			let tempStatus = obj[i].status;
			if (tempStatus == module.status.RINGING) {
				tempStatus = module.status.ACTIVE;
			}

			let timer = this.createTimer(module, obj[i].duration, obj[i].name, tempStatus, obj[i].startDate, obj[i].msOffset);
			if (obj[i].status == module.status.PAUSED) {
				this.tick(module, timer);
			}
			timer.querySelector(".h-input").value = obj[i].hh;
			timer.querySelector(".m-input").value = obj[i].mm;
			timer.querySelector(".s-input").value = obj[i].ss;
		}
	},

	//get the sort value given a status
	statusToSortValue: function(module, status){
		switch(status) {
			case module.status.INACTIVE: return 2;
			case module.status.ACTIVE: return 3;
			case module.status.PAUSED: return 3;
			case module.status.RINGING: return 1;
		}
	},

	init: function(module){
		module.status = {
			INACTIVE: 1,
			ACTIVE: 2,
			PAUSED: 3,
			RINGING: 4,
		}

		let volume = getSetting(this.name, "volume");
		if (volume > 100) volume = 100;
		if (volume < 0) volume = 0;
		module.usingAudio = false;
		if (volume > 0) {
			module.loadedAudio = new Audio("pixbay-alarm-clock-short.mp3"); //the audio that is played when ringing
			module.loadedAudio.loop = true;
			module.loadedAudio.volume = volume/100;
			module.usingAudio = true;
		}

		module.timerTickInterval = null; //the interval set if any timers exist
		module.numberOfRingingTimers = 0;

		let _this = this;
		module.q(".mt_insertButton").addEventListener("click",function(){
			_this.addTimer(module);
			_this.saveAllTimers(module);
		});

		//show confirmation before reloading/closing the tab when there are active
		window.onbeforeunload = function(e) {
			if (!getSetting(_this.name, "promptOnClose"))
				return;

			//check for active timers
			let timers = module.qAll(".timer");
			for (let i=0; i<timers.length; i++) {
				if (timers[i].status == module.status.ACTIVE || timers[i].status == module.status.RINGING) {
					e.preventDefault();
					return "There are currently timers running, are you sure you would like to exit?";
				}
			}
		}

		//sort button
		module.q(".mt_sort").addEventListener("click", function(){
			//get timers
			let timers = Array.from(module.qAll(".timer"));

			//sort in order of ringing; lowest number first, inactive, active/paused; lowest number first
			timers.sort(function(a,b){
				let aSortVal = _this.statusToSortValue(module, a.status);
				let bSortVal = _this.statusToSortValue(module, b.status);
				if (aSortVal != bSortVal) return aSortVal > bSortVal;

				let differenceA = new Date()-a.startDate;
				let timeA = a.duration-(differenceA+a.msOffset);
				let differenceB = new Date()-b.startDate;
				let timeB = b.duration-(differenceB+b.msOffset);
				return timeA > timeB;
			});

			//insert sorted timers
			let timerList = module.q(".timers");
			let addButton = module.q(".mt_insertButton");
			for(let i=0; i<timers.length; i++) {
				timerList.insertBefore(timers[i], addButton);
			}
		});

		//save if any field on a timer changes
		module.q(".timers").addEventListener("change", function(){
			_this.saveAllTimers(module);
		});

		//notifications button
		module.q(".mt_notifButton").addEventListener("click", function(){
			Notification.requestPermission().then((permission) => {
				if (permission != "granted") {
					alert("Timer notifications will not displayed while notifications are not granted.");
				} else {
					this.hidden = true;
				}
			});
		});

		//check if nofications are enabled
		if (getSetting(_this.name, "notifyOnRing") && "Notification" in window &&
			Notification.permission != "granted"){
			module.q(".mt_notifButton").hidden = false;
		}

		this.loadAllTimers(module);
	},

	deconstructInstance: function(module){
		if (module.usingAudio) {
			module.loadedAudio.pause();
			module.loadedAudio.currentTime = 0;
		}
		clearInterval(module.timerTickInterval);
		module.timerTickInterval = null;
	},

	instantiate: function(where){
		where.innerHTML = /*html*/`
			<div class="fs30b">Multi timer</div>
			<div class="flex-container timers">
				<template class="timer_tmplt">
					<span class="timer">
						<input type="text" class="mt_name"/>
						<input class="x-button" type="button" value="x">
						<br/>
						<input type="button" class="start-button" value="Start"/>
						<span hidden class="time-display"></span>
						<span class="time-input">
							<input class="h-input width2" type="text" placeholder="HH">
							<span>:</span>
							<input class="m-input width2" type="text" placeholder="MM">
							<span>:</span>
							<input class="s-input width2" type="text" placeholder="SS">
						</span>
					</span>
				</template>
				<input type="button" class="mt_notifButton" value="Enable notifications" hidden>
				<input type="button" class="mt_insertButton" value="+">
			</div>
			<input type="button" class="mt_sort" value="Sort">
		`
	},

	//returns an array containing a list of functions and an update version to run at
	updates: function(){
		return [
			{ver: "0.9.0", func: function(){
				log("Converting mt_timers to less excessive escaping.");
				let oldSave = localStorage.getItem("mt_timers");
				let firstParse = JSON.parse(oldSave);
				let obj = [];
				for(let i=0; i<firstParse.length; i++){
					obj[i] = JSON.parse(firstParse[i]);
				}
				localStorage.setItem("mt_timers", JSON.stringify(obj));
			}},
			{ver: "1.0.0", func: function(){
				log("Converting status to new save format.");
				let oldSave = localStorage.getItem("mt_timers");
				if (!oldSave) return;
				let obj = JSON.parse(oldSave);

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
