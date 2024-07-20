'use strict';
dashboard.tests.registerTester(
	"codeEditor",
	[
		//test paren wrap
		{name: "parenWrap", test: function(inst){
			inst.q(".codeEditorTextarea").value = "1\n2";
			dashboard.tests.click(inst.q(".ce_pwrap"));

			return (inst.q(".codeEditorTextarea").value === "(1\n2)");
		}},

		//test json beautify
		{name: "jsonBeautify", test: function(inst){
			inst.q(".codeEditorTextarea").value = `{"a":2,"b":{"c":1}}`;
			dashboard.tests.click(inst.q(".ce_beautify"));

			return (inst.q(".codeEditorTextarea").value === `{\n\t"a": 2,\n\t"b": {\n\t\t"c": 1\n\t}\n}`);
		}},

		//test js eval return
		{name: "eval", test: function(inst){
			//force no warning
			dashboard.tests.forceSetting("codeEditor", "evalWarn", false);

			inst.q(".codeEditorTextarea").value = "1+2;";
			dashboard.tests.click(inst.q(".ce_eval"));

			return (inst.q(".codeEditorReturnValue").innerHTML === "Return value: 3");
		}},

		//test js eval output
		{name: "eval", test: function(inst){
			//force no warning
			dashboard.tests.forceSetting("codeEditor", "evalWarn", false);

			inst.q(".codeEditorTextarea").value = "output(1+2);";
			dashboard.tests.click(inst.q(".ce_eval"));

			return (inst.q(".codeEditorOutput").textContent === "3");
		}},

		//test js eval errors
		{name: "eval", test: function(inst){
			//force no warning
			dashboard.tests.forceSetting("codeEditor", "evalWarn", false);

			inst.q(".codeEditorTextarea").value = "-";
			dashboard.tests.click(inst.q(".ce_eval"));

			const outputDiv = inst.q(".codeEditorOutput");
			return (outputDiv.textContent.length > 0 && outputDiv.style.color === "red");
		}},

		//test saving, loading, and deleting
		{name: "eval", test: function(inst){
			//check that testScript doesn't already exist, otherwise the test will fail
			let testExists = inst.q(".ce_selector > option[value='testScript']");
			if (testExists) {
				error("Failed to run test, testScript already exists.");
				return false;
			}

			const textArea = inst.q(".codeEditorTextarea");
			const saveName = inst.q(".codeEditorSaveName");
			const saveButton = inst.q(".saveCode");
			const selector = inst.q(".ce_selector");
			const deleteButton = inst.q(".deleteSelection");

			//save a new script
			textArea.value = "abcde";
			saveName.value = "testScript";
			dashboard.tests.click(saveButton);

			//check that the new script exists
			testExists = inst.q(".ce_selector > option[value='testScript']");
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
			testExists = inst.q(".ce_selector > option[value='testScript']");
			if (testExists)
				return false;

			return true;
		}},
	]
);
