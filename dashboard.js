var dashboard = {
	functionsToCall: [],
	hasRun: false,

	//calls the function passed to it when the page is done loading, or right away if the page is already loaded
	setOnLoad: function(f){
		if(!dashboard.hasRun){
			dashboard.functionsToCall.push(f);
		}else{
			f();
		}
	},

	//calls all of the functions and purges the list
	processOnLoad: function(){
		hasRun = true;
		for(let i=dashboard.functionsToCall.length-1; i>=0; i--){
			dashboard.functionsToCall[i]();
			dashboard.functionsToCall.pop();
		}
	},
}

//call all of the registered functions when the page is loaded
if (document.readyState === 'complete') {
	dashboard.processOnLoad();
} else {
	window.addEventListener("load", dashboard.processOnLoad);
}
