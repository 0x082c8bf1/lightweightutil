//adds 0s to the begining of a number such that the minimum width is width
function LeftZeroFillNumber(num, width){
	let string = "" + num;

	let output = "";
	for(let i=string.length;i<width;i++){
		output += "0";
	}
	output += string;

	return output;
}

function createDuration(h,m,s){
	let ms = s * 1000 + m * 1000*60 + h*1000*60*60;
	return {hours: h, minutes: m, seconds: s, totalMS: ms};
}

//show confirmation before reloading/closing the tab when there are timers
window.onbeforeunload = function (event) {
	if(timerTickInterval != null){
		event.preventDefault();
		return "There are currently timers running, are you sure you would like to exit?";
	}
}

//converts a duration in ms to a duration object
function getDurationFromMS(ms){
	let MS_PER_SEC = 1000;
	let MS_PER_MIN = MS_PER_SEC*60;
	let MS_PER_HOUR = MS_PER_MIN*60;

	let hours = Math.floor(ms / MS_PER_HOUR);
	ms %= MS_PER_HOUR;

	let minutes = Math.floor(ms / MS_PER_MIN);
	ms %= MS_PER_MIN;

	let seconds = Math.floor(ms / MS_PER_SEC);
	ms %= MS_PER_SEC;

	return createDuration(hours, minutes, seconds);
}

//converts a duration in ms to a string in HH:MM:SS
function getDurationAsString(duration){
	let output = "";

	//handle negative durations
	if(duration<0){
		duration = Math.abs(duration);
		if(duration >= 1000){
			output += "-";
		}
	}

	let dur = getDurationFromMS(duration);

	output += LeftZeroFillNumber(dur.hours, 2);
	output += ":";
	output += LeftZeroFillNumber(dur.minutes, 2);
	output += ":";
	output += LeftZeroFillNumber(dur.seconds, 2);

	return output;
}

var timers = [];//list of all the timers
var timerTickInterval = null; //the interval set if any timers exist

var timerRingInterval = null; //the interval to check if any alarms are ringing
var numberOfRingingTimers = 0; //the count of currently ringing timers
var loadedAudio = new Audio("pixbay-alarm-clock-short.mp3"); //the audio that is played when ringing

class Timer{
	constructor(){
		//init element fragment
		let element = timer_tmplt.content.cloneNode(true);
		this.timer = element.querySelector(".timer");//the element that this timer object corresponds to

		//add element to dom
		document.getElementById("timers").insertBefore(element, document.getElementById("insertButton"));

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
			mt_deleteTimer(_this);
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
			numberOfRingingTimers++;
		}else{
			numberOfRingingTimers--;
		}

		//start ringing
		if(numberOfRingingTimers>0){
			if(timerRingInterval == null){
				loadedAudio.play();//ring immediately 
				//schedule rings every 1000ms until reset
				timerRingInterval = setInterval(function(){
					loadedAudio.play();
				}, 1000);
			}
		}else{
			clearInterval(timerRingInterval);
			timerRingInterval = null;
			loadedAudio.pause();
			loadedAudio.currentTime = 0;
		}
		_this.ringing = turnOn;

	}

	//function that is called when the start button is clicked
	startButtonEvent(_this){
		//strip non-numeric characters from time
		let  pattern = /\D/g;
		let hours = _this.hInput.value.replace(pattern, "");
		let mins = _this.mInput.value.replace(pattern, "");
		let secs = _this.sInput.value.replace(pattern, "");

		if(_this.startButton.value == "Start" || _this.startButton.value == "Resume"){//if timer should resume
			if(_this.startButton.value == "Start"){//if timer needs to read duration
				_this.duration=createDuration(hours, mins, secs).totalMS;
				_this.timeDisplay.innerHTML = getDurationAsString(_this.duration);
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

			this.timeDisplay.innerHTML = getDurationAsString(timeRemaining);
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
}

//adds a timer
function mt_addTimer(){
	//create timer object
	timers.push(new Timer());

	//set timertick interval if its not set already
	if(timerTickInterval == null){
		timerTickInterval = setInterval(function(){
			for(let i=0;i<timers.length; i++){
				timers[i].tick();
			}
			mt_saveAllTimers();
		}, 100);
	}
}

//removes the element passed to it, called by the delete button on the timer
function mt_deleteTimer(element){
	//remove element from the timers array
	let pos = timers.indexOf(element);
	timers.splice(pos, 1);

	//delete from DOM
	element.timer.parentNode.removeChild(element.timer);

	//clear timer interval if there are no more timers
	if(timers.length == 0){
		clearInterval(timerTickInterval);
		timerTickInterval = null;
		mt_saveAllTimers();
	}
}

//save all of the timers to localStorage
function mt_saveAllTimers(){
	let obj = [];
	for(let i=0; i<timers.length; i++){
		obj.push(timers[i].convertToString());
	}
	localStorage.setItem("mt_timers", JSON.stringify(obj));
}

//load all of the timers from localStorage
function mt_loadAllTimers(){
	let obj = JSON.parse(localStorage.getItem("mt_timers"));
	for(let i=0; i<obj.length; i++){
		mt_addTimer();
		timers[timers.length-1].createFromString(obj[i]);
	}
}

//load the timers when the page loads
if (document.readyState === 'complete') {
	mt_loadAllTimers();
} else {
	window.addEventListener("load", mt_loadAllTimers);
}
