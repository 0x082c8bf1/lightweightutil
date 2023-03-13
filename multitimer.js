dashboard.registerModule({
	name: "multitimer",
	displayName: "Multi timer",

	//adds 0s to the begining of a number such that the minimum width is width
	leftZeroFillNumber: function(num, width){
		let string = "" + num;

		let output = "";
		for(let i=string.length;i<width;i++){
			output += "0";
		}
		output += string;

		return output;
	},

	createDuration: function(h,m,s){
		let ms = s * 1000 + m * 1000*60 + h*1000*60*60;
		return {hours: h, minutes: m, seconds: s, totalMS: ms};
	},

	//converts a duration in ms to a duration object
	getDurationFromMS: function(ms){
		let MS_PER_SEC = 1000;
		let MS_PER_MIN = MS_PER_SEC*60;
		let MS_PER_HOUR = MS_PER_MIN*60;

		let hours = Math.floor(ms / MS_PER_HOUR);
		ms %= MS_PER_HOUR;

		let minutes = Math.floor(ms / MS_PER_MIN);
		ms %= MS_PER_MIN;

		let seconds = Math.floor(ms / MS_PER_SEC);
		ms %= MS_PER_SEC;

		return this.createDuration(hours, minutes, seconds);
	},

	//converts a duration in ms to a string in HH:MM:SS
	getDurationAsString: function(duration){
		let output = "";

		//handle negative durations
		if(duration<0){
			duration = Math.abs(duration);
			if(duration >= 1000){
				output += "-";
			}
		}

		let dur = this.getDurationFromMS(duration);

		output += this.leftZeroFillNumber(dur.hours, 2);
		output += ":";
		output += this.leftZeroFillNumber(dur.minutes, 2);
		output += ":";
		output += this.leftZeroFillNumber(dur.seconds, 2);

		return output;
	},

	Timer: class {
		constructor(instance, module){
			//NOTE: For this module, the instance is the object passed in from init() and module is the module template.
			this.module = module;

			//init element fragment
			let element = instance.q(".timer_tmplt").content.cloneNode(true);
			element.querySelector(".mt_name").value = getSetting(module.name, "defaultName")

			this.timer = element.querySelector(".timer");//the element that this timer object corresponds to

			//add element to dom
			instance.q(".timers").insertBefore(element, instance.q(".mt_insertButton"));

			//element references
			this.xButton = this.timer.querySelector(".x-button");
			this.startButton = this.timer.querySelector(".start-button");
			this.timeDisplay = this.timer.querySelector(".time-display");
			this.timeInput = this.timer.querySelector(".time-input");
			this.hInput = this.timer.querySelector(".h-input");
			this.mInput = this.timer.querySelector(".m-input");
			this.sInput = this.timer.querySelector(".s-input");
			this.nameInput = this.timer.querySelector(".mt_name");

			//default variable values
			this.msOffset = 0;
			this.startDate = null;
			this.duration = 1000*60;
			this.ringing = false;

			this.notifSent = false;//because this is not saved, it will alert you when you start the page.

			//references to this object for eventlisteners
			let _this = this;

			//event listeners
			this.xButton.addEventListener("click", function(){
				_this.resetEvent(instance, _this);
			});

			this.startButton.addEventListener("click", function(){
				_this.startButtonEvent(instance, _this);
			});

			this.hInput.addEventListener("keydown", function(e){
				if (e.code == "Tab"){
					let remainingText = this.value.substring(this.selectionEnd, this.value.length);
					let nextPos = remainingText.indexOf("d");

					if (nextPos != -1){
						e.preventDefault();
						let pos = this.selectionEnd + 1 + nextPos;
						this.selectionEnd = pos;
						this.selectionStart = pos;
					}
				}
			});

			this.timer.addEventListener("keydown", function(e){
				if(e.code == "Enter" || e.code == "NumpadEnter"){
					_this.startButtonEvent(instance, _this);
					//we have to explicitly call saveAllTimers because might hide the element that we hit enter on, and
					//the event won't bubble if that's the case
					_this.module.saveAllTimers(instance);
				}
			});
		}

		//toggles between showing the time left and editing the duration
		toggleEditMode(_this){
			_this.timeInput.hidden = !_this.timeInput.hidden;
			_this.timeDisplay.hidden = !_this.timeInput.hidden;
		}

		//function that is called when the x button is clicked
		resetEvent(module, _this){
			if(_this.startButton.value == "Start"){
				_this.module.deleteTimer(module, _this);
			}else{
				//remove from ringing timers if ringing
				if(_this.startButton.value == "Reset"){
					_this.updateRinger(module, _this, false);
					this.timeDisplay.style.color = "white";
				}

				//go to edit mode
				_this.startButton.value = "Start";
				module.msOffset = 0;
				_this.startDate = null;
				_this.toggleEditMode(_this);
			}
		}

		//function that updates the ringer when a timer is reset or deleted while ringing
		//turnOn is weather the timer is starting ringing or stopping ringing
		//TODO add option to change sound via url
		//TODO add options to change how much the sound loops
		updateRinger(module, _this, turnOn){
			//don't do anything if _this.ringing is already what it should be set to
			if(turnOn==module.ringing){
				return;
			}

			if(turnOn){
				module.numberOfRingingTimers++;
			}else{
				module.numberOfRingingTimers--;
			}

			//start ringing
			if(module.numberOfRingingTimers>0){
				if(module.timerRingInterval == null){
					module.loadedAudio.play();//ring immediately
					//schedule rings every 1000ms until reset
					module.timerRingInterval = setInterval(function(){
						module.loadedAudio.play();
					}, 1000);
				}
			}else{
				clearInterval(module.timerRingInterval);
				module.timerRingInterval = null;
				module.loadedAudio.pause();
				module.loadedAudio.currentTime = 0;
			}
			module.ringing = turnOn;

		}

		//takes a string and tries it's best to assume what was supposed to be typed in as a number
		makeValidNumber(input){
			let pattern = /[^\d|^\.]/g;

			return input.replace(pattern, "");
		}

		//function that is called when the start button is clicked
		startButtonEvent(module, _this){
			let hours, mins, secs;

			if (_this.hInput.value.includes("d")){
				//get the left and right of "d"
				let hval = hours = _this.hInput.value;
				let splitPos = hval.indexOf("d");
				let lSeg = hval.substring(0,splitPos);
				let rSeg = hval.substring(splitPos+1);

				//convert left and right to numbers
				let dys = parseFloat(_this.makeValidNumber(lSeg));
				let hrs = parseFloat(_this.makeValidNumber(rSeg));

				//handle not putting a number before or after "d"
				dys = (isNaN(dys)) ? 0 : dys;
				hrs = (isNaN(hrs)) ? 0 : hrs;

				hours = dys*24 + hrs;

			}else{
				hours = _this.makeValidNumber(_this.hInput.value);
			}

			mins = _this.makeValidNumber(_this.mInput.value);
			secs = _this.makeValidNumber(_this.sInput.value);

			if(_this.startButton.value == "Start" || _this.startButton.value == "Resume"){//if timer should resume
				if(_this.startButton.value == "Start"){//if timer needs to read duration
					_this.duration=_this.module.createDuration(hours, mins, secs).totalMS;
					_this.timeDisplay.innerHTML = _this.module.getDurationAsString(_this.duration);
					_this.toggleEditMode(_this);
				}

				_this.startButton.value = "Pause";
				_this.startDate = new Date();
			}else if(_this.startButton.value == "Pause"){//if timer needs to pause
				_this.msOffset += new Date()-_this.startDate;
				_this.startButton.value = "Resume";
				_this.startDate = null;
			}else if(_this.startButton.value == "Reset"){//if timer needs to reset
				this.resetEvent(module, _this);
			}
		}

		//function that is called periodically to update the timer
		tick(module){
			if(this.startDate != null){
				let difference = new Date()-this.startDate;
				let timeRemaining = this.duration-(difference+this.msOffset);

				this.timeDisplay.innerHTML = this.module.getDurationAsString(timeRemaining);
				if(timeRemaining <= 0){
					if (!this.notifSent && getSetting(this.module.name, "notifyOnRing")){
						new Notification("Multi Timer: " + this.nameInput.value + " is over.");
						this.notifSent = true;
					}

					this.startButton.value = "Reset";
					this.timeDisplay.style.color = "red";
					this.updateRinger(module, this, true);
				} else {
					this.notifSent = false;
				}
			}
		}

		createFromObject(module, obj){
			if(obj.startDate != null)
				obj.startDate = new Date(obj.startDate);

			//get the timer to the right state
			//NOTE: this has to be done before msOffset is loaded to not overwrite it's value
			switch (obj.state){
				case "Reset":
					this.startButtonEvent(module, this); //start
				case "Pause":
					this.startButtonEvent(module, this); //start
					break;
				case "Resume":
					this.startButtonEvent(module, this); //start
					this.startButtonEvent(module, this); //pause
					break;
				case "Start":
					//default state
					break;
				default:
					return;
			}

			//load the values
			this.msOffset = obj.msOffset;
			this.startDate = obj.startDate;
			this.duration = obj.duration;
			this.hInput.value = obj.hh;
			this.mInput.value = obj.mm;
			this.sInput.value = obj.ss;
			this.nameInput.value = obj.name;

			switch(obj.state){
				case "Resume":
					//update the resume display
					let timeRemaining = this.duration-(this.msOffset);
					this.timeDisplay.innerHTML = this.module.getDurationAsString(timeRemaining);
					break;
				case "Reset":
					this.updateRinger(module, this, true); //make it ring
					break;
			}
		}

		convertToSaveObject(){
			let obj = {};

			//save internal values
			obj.state = this.startButton.value;
			obj.msOffset = this.msOffset;
			obj.startDate = this.startDate;
			obj.duration = this.duration;

			//save user facing values
			obj.hh = this.hInput.value;
			obj.mm = this.mInput.value;
			obj.ss = this.sInput.value;
			obj.name = this.nameInput.value;

			return obj;
		}
	},

	//adds a timer
	addTimer: function(module){
		let _this = this;
		//create timer object
		module.timers.push(new this.Timer(module, this));

		//set timertick interval if its not set already
		if(module.timerTickInterval == null){
			module.timerTickInterval = setInterval(function(){
				for(let i=0;i<module.timers.length; i++){
					module.timers[i].tick(module);
				}
			}, 100);
		}
	},

	//removes the element passed to it, called by the delete button on the timer
	deleteTimer: function(module, element){
		//remove element from the timers array
		let pos = module.timers.indexOf(element);
		module.timers.splice(pos, 1);

		//delete from DOM
		element.timer.parentNode.removeChild(element.timer);

		//clear timer interval if there are no more timers
		if(module.timers.length == 0){
			clearInterval(module.timerTickInterval);
			module.timerTickInterval = null;
		}
	},

	//save all of the timers to localStorage
	saveAllTimers: function(module){
		let obj = [];
		for(let i=0; i<module.timers.length; i++){
			obj.push(module.timers[i].convertToSaveObject());
		}
		localStorage.setItem("mt_timers", JSON.stringify(obj));
	},

	//load all of the timers from localStorage
	loadAllTimers: function(module){
		//reset timers, this fixes an issue with timers being duplicated when a layout reload is called.
		module.timers = [];

		let obj = JSON.parse(localStorage.getItem("mt_timers"));

		if (obj == null)
			return;

		for(let i=0; i<obj.length; i++){
			this.addTimer(module);
			module.timers[module.timers.length-1].createFromObject(module, obj[i]);
		}

		//tick all the timers once, this prevents a delay to show the timewhen reloading
		for (let i=0; i<module.timers.length; i++){
			module.timers[i].tick();
		}
	},

	//API for creating a timer in the specific module instance
	createWith: function(module, hours, minutes, seconds, name, started){
		//create timer
		this.addTimer(module);
		let newTimer = module.timers[module.timers.length-1];

		//setup passed values
		newTimer.hInput.value = hours;
		newTimer.mInput.value = minutes;
		newTimer.sInput.value = seconds;
		newTimer.nameInput.value = name;

		//start if applicable
		if (started){
			newTimer.startButtonEvent(module, newTimer);
		}
	},

	init: function(module){
		let _this = this;

		module.timers = []; //list of all the timers
		module.timerTickInterval = null; //the interval set if any timers exist

		module.timerRingInterval = null; //the interval to check if any alarms are ringing
		module.numberOfRingingTimers = 0; //the count of currently ringing timers
		module.loadedAudio = new Audio("pixbay-alarm-clock-short.mp3"); //the audio that is played when ringing

		//show confirmation before reloading/closing the tab when there are timers
		window.onbeforeunload = function (event) {
			if (!getSetting(_this.name, "promptOnClose"))
				return;

			if(module.timerTickInterval != null){
				event.preventDefault();
				return "There are currently timers running, are you sure you would like to exit?";
			}
		}

		module.q(".mt_notifButton").addEventListener("click", function(){
			Notification.requestPermission().then((permission) => {
				if (permission != "granted") {
					alert("Timer notifications will not displayed while notifications are not granted.");
				} else {
					this.hidden = true;
				}
			});
		});
		//event listerner for adding a timer
		module.q(".mt_insertButton").addEventListener("click", function(){
			_this.addTimer(module);
		});

		//check if nofications are enabled
		if (getSetting(_this.name, "notifyOnRing") && "Notification" in window &&
			Notification.permission != "granted"){
			module.q(".mt_notifButton").hidden = false;
		}

		//load
		this.loadAllTimers(module);

		//event listeners for saving the timers
		module.q(".timers").addEventListener("click", function(){
			_this.saveAllTimers(module);
		});
		module.q(".timers").addEventListener("keyup", function(){
			_this.saveAllTimers(module);
		});
	},

	instantiate: function(where){
		where.innerHTML = /*html*/`
			<div class="fs30b">Multi timer</div>
			<div class="flex-container timers">
				<template class="timer_tmplt">
					<span class="timer">
						<input type="text" class="mt_name"/>
						<input class="x-button button" type="button" value="x">
						<br/>
						<input type="button" class="start-button button" value="Start"/>
						<span hidden class="time-display"></span>
						<span class="time-input">
							<input class="h-input width2" type="text" placeholder = "HH">
							<span>:</span>
							<input class="m-input width2" type="text" value=1 placeholder = "MM">
							<span>:</span>
							<input class="s-input width2" type="text" placeholder = "SS">
						</span>
					</span>
				</template>
				<input type="button" class="button mt_notifButton" value="Enable notifications" hidden>
				<input type="button" class="button mt_insertButton" value="+">
			</div>
		`
	},

	//returns an array containing a list of functions and an update version to run at
	updates: function(){
		return [
			{ver: "0.9.0", func: function(){
				log("Converting mt_timers to less excessive escaping.");
				let oldSave = localStorage.getItem("mt_timers");
				localStorage.setItem("mt_timers.0.9.0", oldSave);
				let firstParse = JSON.parse(oldSave);
				let obj = [];
				for(let i=0; i<firstParse.length; i++){
					obj[i] = JSON.parse(firstParse[i]);
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
		]
	},

	registerDocumentation: function(){
		return [
			"You can hit the + button to create a new timer. Once a timer is created you can type a time limit into the hh:mm:ss fields to set how long the timer will ring in. Once the time is filed out, you can hit the Start button to start the timer.",
			"Once the time is up, the timer will start ringing. If more than one timer is ringing at a time, you will only hear one alarm, all timers must be stopped for the ringing to stop.",
			"While a timer is running, you can click the Pause button to put the timer on hold temporarily, and then hit the Resume button to begin it again.",
			"Hitting the X button while a timer is running will reset the timer, hitting the timer from it's reset state will remove the timer.",
			"If you type a \"d\" into the hh field, it will parse the number to the left of the \"d\" as days, and the number to the right as hours.",
			"The createWith(module, hours, minutes, seconds, name, started) API function can be used to create a module in an automated way.",
		]
	},
});
