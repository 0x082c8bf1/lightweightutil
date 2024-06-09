'use strict';
dashboard.tests.registerTester(
	"textbox",
	[
		//test sorting the lines
		{name: "lineSort", test: function(module){
			module.q(".textarea").value = "b\nc\na";
			dashboard.tests.click(module.q(".tb_sort"));
			return (module.q(".textarea").value === "a\nb\nc");
		}},

		//test removing duplicate lines
		{name: "removeDupes", test: function(module){
			module.q(".textarea").value = "c\na\nc";
			dashboard.tests.click(module.q(".tb_removeDupes"));
			return (module.q(".textarea").value === "c\na");
		}},

		//test converting to uppercase
		{name: "toUpper", test: function(module){
			module.q(".textarea").value = "abc\n123";
			dashboard.tests.click(module.q(".tb_toupper"));
			return (module.q(".textarea").value === "ABC\n123");
		}},

		//test converting to lowercase
		{name: "toLower", test: function(module){
			module.q(".textarea").value = "ABC\n123";
			dashboard.tests.click(module.q(".tb_tolower"));
			return (module.q(".textarea").value === "abc\n123");
		}},

		//test regex find and replace
		{name: "regexReplace", test: function(module){
			module.q(".textarea").value = "abc\n123\napc";
			//replace does not require being visible during the test
			module.q(".replaceInputPattern").value = "a.c";
			module.q(".replaceOutputPattern").value = "888";
			module.q(".regexSearch").checked = true;
			dashboard.tests.click(module.q(".tb_repace"));
			return (module.q(".textarea").value === "888\n123\n888");
		}},

		//test normal find and replace
		{name: "normalReplace", test: function(module){
			module.q(".textarea").value = "abc\n123\na.c";
			//replace does not require being visible during the test
			module.q(".replaceInputPattern").value = "a.c";
			module.q(".replaceOutputPattern").value = "888";
			module.q(".regexSearch").checked = false;
			dashboard.tests.click(module.q(".tb_repace"));
			return (module.q(".textarea").value === "abc\n123\n888");
		}},

		//test repacing newlines in regex find and replace
		{name: "regexReplaceNewline", test: function(module){
			module.q(".textarea").value = "abc\n123\napc";
			//replace does not require being visible during the test
			module.q(".replaceInputPattern").value = "\\n";
			module.q(".replaceOutputPattern").value = ",";
			module.q(".regexSearch").checked = true;
			dashboard.tests.click(module.q(".tb_repace"));
			return (module.q(".textarea").value === "abc,123,apc");
		}},
		//test adding newlines in regex find and replace
		{name: "regexReplaceNewlineReverse", test: function(module){
			module.q(".textarea").value = "abc,123,apc";
			//replace does not require being visible during the test
			module.q(".replaceInputPattern").value = ",";
			module.q(".replaceOutputPattern").value = "\\n";
			module.q(".regexSearch").checked = true;
			dashboard.tests.click(module.q(".tb_repace"));
			return (module.q(".textarea").value === "abc\n123\napc");
		}},
	]
);
