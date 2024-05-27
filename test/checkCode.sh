#!/usr/bin/bash

testRegex(){
	if [ -n "$3" ]; then
		argOpts=$3
	fi

	grep -Pinr "$1" --exclude="checkCode.sh" --binary-files=without-match --exclude README.md --exclude LICENSE $argOpts --exclude-dir=".git" $src --color=always
	if [ $? -eq 0 ]; then
		echo "^^^ $2"
	fi
}

src=$(dirname $(pwd))

#			Pattern					Comment										Custom grep arguments
testRegex	"/[/\*].*todo.*:"		"Remove all todos"
testRegex	"console\?*.log"		"use log() for all permanent logging" 		"--exclude="common.js""
testRegex	"(\s | \s)"				"Use tabs and/or don't mix whitespace"
testRegex	"(\}else|else\{)"		"Use spaces between else and braces"
testRegex	"[\t ]$"				"No trailing whitespace"
testRegex	"(^\s*else|else$)"		"Elses must have braces"
testRegex	"debugger"				"Remove all debugger calls"
testRegex	"/\*(?!html)"			"No block comments (except html specifier)"
testRegex	"[!=]=\s*(true|false)"	"Don't check equality on true/false"
