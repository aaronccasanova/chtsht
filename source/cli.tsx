#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './ui';

const cli = meow(
	`
	Usage
	  $ npx chtsht <name>

	Options
	  --exec, -e  Execute the command

	Examples
	  # Show select list of all cheat sheets
	  $ npx chtsht

	  # Show the docker cheat sheet
	  $ npx chtsht docker

		# Execute the command
		$ npx chtsht -e docker
`,
	{
		flags: {
			exec: {
				alias: 'e',
				type: 'boolean',
				default: false
			}
		}
	}
);

render(<App cheatsheet={cli.input[0]} exec={cli.flags.exec}/>);
