#!/usr/bin/bash

testRegex(){
	argOpts=""
	if [ -n "$4" ]; then
		argOpts=$4
	fi

	grep -Pinr "$2" --exclude="checkCode.sh" --binary-files=without-match --exclude README.md --exclude LICENSE $argOpts --exclude-dir=".git" $1 --color=always
	if [ $? -eq 0 ]; then
		echo "^^^ $3"
	fi
}

src=$(dirname "$(dirname "$(realpath "$0")")")

#			Files	Pattern					Comment										Custom grep arguments
testRegex	"$src"	"/[/\*].*todo.*:"		"Remove all todos"
testRegex	"$src"	"console\?*.log"		"use log() for all permanent logging" 		"--exclude="common.js""
testRegex	"$src"	"console\?*.error"		"use error() for all permanent errors" 		"--exclude="common.js""
testRegex	"$src"	"(\s | \s)"				"Use tabs and/or don't mix whitespace"
testRegex	"$src"	"(\}else|else\{)"		"Use spaces between else and braces"
testRegex	"$src"	"[\t ]$"				"No trailing whitespace"
testRegex	"$src"	"(^\s*else|else$)"		"Elses must have braces"
testRegex	"$src"	"debugger"				"Remove all debugger calls"
testRegex	"$src"	"/\*(?!html)"			"No block comments (except html specifier)"
testRegex	"$src"	"[!=]=\s*(true|false)"	"Don't check equality on true/false"
testRegex	"$src"	"\r$"					"Line endings should be LF"
testRegex	"$src"	"^(?!.*//)(?!\r)(?!.*\sif[\s(])(?!\s*$)(?!.*[{};,[\]:>\`(]$)" \
											"Lines should end in a semicolon"
testRegex	"$src"	"[\s=](confirm|alert)\(" \
											"Use db_confirm and db_alert"				"--exclude="common.js""
testRegex	"$src/modules/dashboard.js" \
					"enabled: true,"		"Don't leave tests enabled"					"--with-filename"
testRegex	"$src"	"[^\s]\[\".+\"\]"			"Constant accessors should use . instead of []"
testRegex	"$src"	"\sif[\s(].*[^=^!^<^>]=[^=].*\)" \
											"No assignments in ifs"
testRegex	"$src"	"(\w+\s*==\s*\"(\w\s*)+\"|\"(\w\s*)+\"\s*==\s*\w+)" \
											"Compare strings with ==="
