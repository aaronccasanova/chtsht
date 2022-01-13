import fs from "fs";
import path from "path";
import os from "os";

import React from "react";
import SelectInput from "ink-select-input";
import Table from "ink-table";
import prompts from "prompts";
import execa from "execa";
import chalk from "chalk";

export interface Entry {
	description: string;
	command: string;
}

export type Entries = Entry[];

interface Cheatsheets {
	[name: string]: Entries;
}

export interface AppProps {
	cheatsheet?: keyof Cheatsheets;
	exec?: boolean;
}

const configPath = path.resolve(os.homedir(), ".cheatsheet");

if (!fs.existsSync(configPath)) {
	throw new Error("Could not find config file at ~/.cheatsheet");
}

// pm2, gcloud, docker, git, Caddy, quick link to caddy file...
const cheatsheets: Cheatsheets = JSON.parse(
	fs.readFileSync(configPath, "utf-8")
);

function App(props: AppProps) {
	const [cheatsheet, setCheatsheet] = React.useState(
		cheatsheets[props.cheatsheet!] ? props.cheatsheet! : ""
	);

	return cheatsheet ? (
		<Cheatsheet entries={cheatsheets[cheatsheet]!} exec={props.exec} />
	) : (
		<SelectInput
			items={Object.keys(cheatsheets).map((name) => ({
				label: name,
				value: name,
			}))}
			onSelect={(item) => setCheatsheet(item.value)}
		/>
	);
}

export interface CheatsheetProps {
	exec?: boolean;
	entries: Entries;
}

export function Cheatsheet(props: CheatsheetProps) {
	const [state, setState] = React.useState<{
		run: boolean;
		params: null | string[];
	}>({
		run: false,
		params: null,
	});

	const entry = React.useRef<null | Entry>(null);

	React.useEffect(() => {
		(async function run() {
			if (!entry.current) return;

			let command = entry.current.command;

			if (state.params) {
				const response = await prompts(
					state.params.map((param) => ({
						type: "text",
						name: param,
						message: param,
					}))
				);

				Object.entries(response).forEach(([param, value]) => {
					command = command.replace(param, value);
				});
			}

			const { stdout, stderr } = await execa.command(command);

			console.log("\n======\n");
			console.log("COMMAND: ", chalk.green(command), "\n");
			stdout && console.log("\n", stdout);
			stderr && console.log("\n", stderr);
			console.log("\n======\n");

			entry.current = null;
			setState({ run: false, params: null });
		})();
	}, [state]);

	return !props.exec ? (
		<Table
			data={props.entries.map((entry) => ({
				Description: entry.description,
				Command: entry.command,
			}))}
		/>
	) : (
		<SelectInput
			isFocused={!state.params}
			items={Object.values(props.entries).map((entry) => ({
				label: `${entry.description}: ${entry.command}`,
				value: entry.command,
			}))}
			onSelect={(item) => {
				const selected = props.entries.find((i) => i.command === item.value)!;

				entry.current = selected;

				setState({
					run: true,
					params: selected.command.match(/<[^>]+>/g),
				});
			}}
		/>
	);
}

module.exports = App;
export default App;