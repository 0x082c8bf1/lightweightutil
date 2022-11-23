dashboard.registerModule({
	name: "multitimer",

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

	timers: [],//list of all the timers
	timerTickInterval: null, //the interval set if any timers exist

	timerRingInterval: null, //the interval to check if any alarms are ringing
	numberOfRingingTimers: 0, //the count of currently ringing timers
	loadedAudio: new Audio("pixbay-alarm-clock-short.mp3"), //the audio that is played when ringing

	Timer: class {
		constructor(module){
			this.module = module;

			//init element fragment
			let element = timer_tmplt.content.cloneNode(true);
			this.timer = element.querySelector(".timer");//the element that this timer object corresponds to

			//add element to dom
			document.getElementById("timers").insertBefore(element, document.getElementById("mt_insertButton"));

			//element references
			this.xButton = this.timer.querySelector(".x-button");
			this.startButton = this.timer.querySelector(".start-button");
			this.timeDisplay = this.timer.querySelector(".time-display");
			this.timeInput = this.timer.querySelector(".time-input");
			this.hInput = this.timer.querySelector(".h-input");
			this.mInput = this.timer.querySelector(".m-input");
			this.sInput = this.timer.querySelector(".s-input");
			this.nameInput = this.timer.querySelector(".name");

			//default variable values
			this.msOffset = 0;
			this.startDate = null;
			this.duration = 1000*60;
			this.ringing = false;

			//references to this object for eventlisteners
			let _this = this;

			//event listeners
			this.xButton.addEventListener("click", function(){
				_this.resetEvent(_this);
			});

			this.startButton.addEventListener("click", function(){
				_this.startButtonEvent(_this);
			});

			this.timer.addEventListener("keydown", function(e){
				if(e.code == "Enter" || e.code == "NumpadEnter"){
					_this.startButtonEvent(_this);
				}
			});
		}

		//toggles between showing the time left and editing the duration
		toggleEditMode(_this){
			_this.timeInput.hidden = !_this.timeInput.hidden;
			_this.timeDisplay.hidden = !_this.timeInput.hidden;
		}

		//function that is called when the x button is clicked
		resetEvent(_this){
			if(_this.startButton.value == "Start"){
				_this.module.deleteTimer(_this);
			}else{
				//remove from ringing timers if ringing
				if(_this.startButton.value == "Reset"){
					_this.updateRinger(_this, false);
					this.timeDisplay.style.color = "white";
				}

				//go to edit mode
				_this.startButton.value = "Start";
				_this.msOffset = 0;
				_this.startDate = null;
				_this.toggleEditMode(_this);
			}
		}

		//function that updates the ringer when a timer is reset or deleted while ringing
		//turnOn is weather the timer is starting ringing or stopping ringing
		//TODO add options to change sound via url
		//TODO add option to change how much the sound loops
		updateRinger(_this, turnOn, auto){
			//don't do anything if _this.ringing is already what it should be set to
			if(turnOn==_this.ringing){
				return;
			}

			if(turnOn){
				_this.module.numberOfRingingTimers++;
			}else{
				_this.module.numberOfRingingTimers--;
			}

			//start ringing
			if(_this.module.numberOfRingingTimers>0){
				if(_this.module.timerRingInterval == null){
					_this.module.loadedAudio.play();//ring immediately 
					//schedule rings every 1000ms until reset
					_this.module.timerRingInterval = setInterval(function(){
						_this.module.loadedAudio.play();
					}, 1000);
				}
			}else{
				clearInterval(_this.module.timerRingInterval);
				_this.module.timerRingInterval = null;
				_this.module.loadedAudio.pause();
				_this.module.loadedAudio.currentTime = 0;
			}
			_this.ringing = turnOn;

		}

		//function that is called when the start button is clicked
		startButtonEvent(_this){
			//strip non-numeric characters from time
			let pattern = /\D/g;
			let hours = _this.hInput.value.replace(pattern, "");
			let mins = _this.mInput.value.replace(pattern, "");
			let secs = _this.sInput.value.replace(pattern, "");

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
				//TODO should this be using resetEvent(_this)?
				_this.updateRinger(_this, false);
				_this.startButton.value = "Start";
				_this.msOffset = 0;
				_this.startDate = null;
				this.timeDisplay.style.color = "white";
				_this.toggleEditMode(_this);
			}
		}

		//function that is called periodically to update the timer
		tick(){
			if(this.startDate != null){
				let difference = new Date()-this.startDate;
				let timeRemaining = this.duration-(difference+this.msOffset);

				this.timeDisplay.innerHTML = this.module.getDurationAsString(timeRemaining);
				if(timeRemaining <= 0){
					this.startButton.value = "Reset";
					this.timeDisplay.style.color = "red";
					this.updateRinger(this, true);
				}
			}
		}

		createFromString(str){
			//parse string
			let obj = JSON.parse(str);

			if(obj.startDate != null)
				obj.startDate = new Date(obj.startDate);

			//get the timer to the right state
			//NOTE: this has to be done before msOffset is loaded to not overwrite it's value
			switch (obj.state){
				case "Reset":
					this.startButtonEvent(this); //start
				case "Pause":
					this.startButtonEvent(this); //start
					break;
				case "Resume":
					this.startButtonEvent(this); //start
					this.startButtonEvent(this); //pause
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
					this.timeDisplay.innerHTML = getDurationAsString(timeRemaining);
					break;
				case "Reset":
					this.updateRinger(this, true); //make it ring
					break;
			}
		}

		convertToString(){
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

			return JSON.stringify(obj);
		}
	},

	//adds a timer
	addTimer: function(){
		let _this = this;
		//create timer object
		this.timers.push(new this.Timer(this));

		//set timertick interval if its not set already
		if(this.timerTickInterval == null){
			this.timerTickInterval = setInterval(function(){
				for(let i=0;i<_this.timers.length; i++){
					_this.timers[i].tick();
				}
				_this.saveAllTimers();
			}, 100);
		}
	},

	//removes the element passed to it, called by the delete button on the timer
	deleteTimer: function(element){
		//remove element from the timers array
		let pos = this.timers.indexOf(element);
		this.timers.splice(pos, 1);

		//delete from DOM
		element.timer.parentNode.removeChild(element.timer);

		//clear timer interval if there are no more timers
		if(this.timers.length == 0){
			clearInterval(this.timerTickInterval);
			this.timerTickInterval = null;
			this.saveAllTimers();
		}
	},

	//save all of the timers to localStorage
	saveAllTimers: function(){
		let obj = [];
		for(let i=0; i<this.timers.length; i++){
			obj.push(this.timers[i].convertToString());
		}
		localStorage.setItem("mt_timers", JSON.stringify(obj));
	},

	//load all of the timers from localStorage
	loadAllTimers: function(){
		let obj = JSON.parse(localStorage.getItem("mt_timers"));

		if (obj == null)
			return;

		for(let i=0; i<obj.length; i++){
			this.addTimer();
			this.timers[this.timers.length-1].createFromString(obj[i]);
		}
	},

	//create a timer with initlized values, intended to be used with the JS eval Code Editor option
	createWith: function(hours, minutes, seconds, name, started){
		//create timer
		this.addTimer();
		let newTimer = timers[timers.length-1];
		
		//setup passed values
		newTimer.hInput.value = hours;
		newTimer.mInput.value = minutes;
		newTimer.sInput.value = seconds;
		newTimer.nameInput.value = name;

		//start if applicable
		if (started){
			newTimer.startButtonEvent(newTimer);
		}
	},

	init: function(){
		let _this = this;

		//show confirmation before reloading/closing the tab when there are timers
		window.onbeforeunload = function (event) {
			if(_this.timerTickInterval != null){
				event.preventDefault();
				return "There are currently timers running, are you sure you would like to exit?";
			}
		}

		document.querySelector(".mt_insertButton").addEventListener("click", function(){
			_this.addTimer();
		});

		//load
		this.loadAllTimers();

	},
});