#!/usr/bin/env node
import React from "react";
import { render } from "ink";
import meow from "meow";
import App from "./ui";

const cli = meow(
	`
	Usage
	  $ npx @aacc/cheatsheet <name>

	Options
	  --exec, -e  Execute the command

	Examples
	  # Show select list of all cheat sheets
	  $ npx @aacc/cheatsheet

	  # Show the docker cheat sheet
	  $ npx @aacc/cheatsheet docker

		# Execute the command
		$ npx @aacc/cheatsheet -e docker
`,
	{
		flags: {
			exec: {
				alias: "e",
				type: "boolean",
				default: false,
			},
		},
	}
);

render(<App cheatsheet={cli.input[0]} exec={cli.flags.exec} />);
