'use strict';
dashboard.tests.registerTester(
	"codeEditor",
	[
		//test paren wrap
		{name: "parenWrap", test: function(module){
			module.q(".codeEditorTextarea").value = "1\n2";
			dashboard.tests.click(module.q(".ce_pwrap"));

			return (module.q(".codeEditorTextarea").value === "(1\n2)");
		}},

		//test json beautify
		{name: "jsonBeautify", test: function(module){
			module.q(".codeEditorTextarea").value = `{"a":2,"b":{"c":1}}`;
			dashboard.tests.click(module.q(".ce_beautify"));

			return (module.q(".codeEditorTextarea").value === `{\n\t"a": 2,\n\t"b": {\n\t\t"c": 1\n\t}\n}`);
		}},

		//test js eval return
		{name: "eval", test: function(module){
			//force no warning
			dashboard.tests.forceSetting("codeEditor", "evalWarn", false);

			module.q(".codeEditorTextarea").value = "1+2;";
			dashboard.tests.click(module.q(".ce_eval"));

			return (module.q(".codeEditorReturnValue").innerHTML === "Return value: 3");
		}},

		//test js eval output
		{name: "eval", test: function(module){
			//force no warning
			dashboard.tests.forceSetting("codeEditor", "evalWarn", false);

			module.q(".codeEditorTextarea").value = "output(1+2);";
			dashboard.tests.click(module.q(".ce_eval"));

			return (module.q(".codeEditorOutput").textContent === "3");
		}},

		//test js eval errors
		{name: "eval", test: function(module){
			//force no warning
			dashboard.tests.forceSetting("codeEditor", "evalWarn", false);

			module.q(".codeEditorTextarea").value = "-";
			dashboard.tests.click(module.q(".ce_eval"));

			let outputDiv = module.q(".codeEditorOutput");
			return (outputDiv.textContent.length > 0 && outputDiv.style.color === "red");
		}},

		//test saving, loading, and deleting
		{name: "eval", test: function(module){
			//check that testScript doesn't already exist, otherwise the test will fail
			let testExists = module.q(".ce_selector > option[value='testScript']");
			if (testExists) {
				error("Failed to run test, testScript already exists.");
				return false;
			}

			let textArea = module.q(".codeEditorTextarea");
			let saveName = module.q(".codeEditorSaveName");
			let saveButton = module.q(".saveCode");
			let selector = module.q(".ce_selector");
			let deleteButton = module.q(".deleteSelection");

			//save a new script
			textArea.value = "abcde";
			saveName.value = "testScript";
			dashboard.tests.click(saveButton);

			//check that the new script exists
			testExists = module.q(".ce_selector > option[value='testScript']");
			if (!testExists)
				return false;

			//testing that we can still load the testScript
			selector.value = "New Script";
			selector.dispatchEvent(new Event('change'));
			selector.value = "testScript";
			selector.dispatchEvent(new Event('change'));
			if (textArea.value !== "abcde") {
				return false;
			}

			//test deleting
			dashboard.tests.click(deleteButton);
			testExists = module.q(".ce_selector > option[value='testScript']");
			if (testExists)
				return false;

			return true;
		}},
	]
);
