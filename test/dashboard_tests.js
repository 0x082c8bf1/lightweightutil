
'use strict';
dashboard.tests.registerTester(
	"dashboard",
	[
		//view settings
		{name: "settings", test: function(){
			dashboard.tests.click(document.querySelector("#settingsToggle"));
			if (document.querySelector("#settingsPane").hidden)
				return false;
			dashboard.tests.click(document.querySelector("#settingsToggle"));
			if (!document.querySelector("#settingsPane").hidden)
				return false;

			return true;
		}},

		//change a setting
		{name: "changeSetting", test: function(){
			dashboard.tests.click(document.querySelector("#settingsToggle"));

			//set setting to oppisite of what it currently is
			let setting = getSetting("dashboard", "displayFooterText");
			default_dashboard_displayFooterText.checked = false;
			dashboard_displayFooterText.checked = !setting;

			//save
			dashboard.tests.click(document.querySelector("#saveSettings"));

			dashboard.tests.click(document.querySelector("#settingsToggle"));

			return (setting != getSetting("dashboard", "displayFooterText"));
		}},

		//view documentation
		{name: "documentation", test: function(){
			dashboard.tests.click(document.querySelector("#documentationToggle"));
			if (document.querySelector("#documentationPane").hidden)
				return false;
			dashboard.tests.click(document.querySelector("#documentationToggle"));
			if (!document.querySelector("#documentationPane").hidden)
				return false;
			return true;
		}},
	]
);
