'use strict';
dashboard.tests.registerTester(
	"textbox",
	[
		//test sorting the lines
		{name: "lineSort", test: function(inst){
			inst.q(".textarea").value = "b\nc\na";
			dashboard.tests.click(inst.q(".tb_sort"));
			return (inst.q(".textarea").value === "a\nb\nc");
		}},

		//test removing duplicate lines
		{name: "removeDupes", test: function(inst){
			inst.q(".textarea").value = "c\na\nc";
			dashboard.tests.click(inst.q(".tb_removeDupes"));
			return (inst.q(".textarea").value === "c\na");
		}},

		//test converting to uppercase
		{name: "toUpper", test: function(inst){
			inst.q(".textarea").value = "abc\n123";
			dashboard.tests.click(inst.q(".tb_toupper"));
			return (inst.q(".textarea").value === "ABC\n123");
		}},

		//test converting to lowercase
		{name: "toLower", test: function(inst){
			inst.q(".textarea").value = "ABC\n123";
			dashboard.tests.click(inst.q(".tb_tolower"));
			return (inst.q(".textarea").value === "abc\n123");
		}},

		//test regex find and replace
		{name: "regexReplace", test: function(inst){
			inst.q(".textarea").value = "abc\n123\napc";
			//replace does not require being visible during the test
			inst.q(".replaceInputPattern").value = "a.c";
			inst.q(".replaceOutputPattern").value = "888";
			inst.q(".regexSearch").checked = true;
			dashboard.tests.click(inst.q(".tb_repace"));
			return (inst.q(".textarea").value === "888\n123\n888");
		}},

		//test normal find and replace
		{name: "normalReplace", test: function(inst){
			inst.q(".textarea").value = "abc\n123\na.c";
			//replace does not require being visible during the test
			inst.q(".replaceInputPattern").value = "a.c";
			inst.q(".replaceOutputPattern").value = "888";
			inst.q(".regexSearch").checked = false;
			dashboard.tests.click(inst.q(".tb_repace"));
			return (inst.q(".textarea").value === "abc\n123\n888");
		}},

		//test repacing newlines in regex find and replace
		{name: "regexReplaceNewline", test: function(inst){
			inst.q(".textarea").value = "abc\n123\napc";
			//replace does not require being visible during the test
			inst.q(".replaceInputPattern").value = "\\n";
			inst.q(".replaceOutputPattern").value = ",";
			inst.q(".regexSearch").checked = true;
			dashboard.tests.click(inst.q(".tb_repace"));
			return (inst.q(".textarea").value === "abc,123,apc");
		}},
		//test adding newlines in regex find and replace
		{name: "regexReplaceNewlineReverse", test: function(inst){
			inst.q(".textarea").value = "abc,123,apc";
			//replace does not require being visible during the test
			inst.q(".replaceInputPattern").value = ",";
			inst.q(".replaceOutputPattern").value = "\\n";
			inst.q(".regexSearch").checked = true;
			dashboard.tests.click(inst.q(".tb_repace"));
			return (inst.q(".textarea").value === "abc\n123\napc");
		}},
	]
);
