import fs from "fs";
import path from "path";
import os from "os";

import React from "react";
import { Newline, Text } from "ink";
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

type Cheatsheets = Record<string, Entries>;

export interface AppProps {
	cheatsheet?: keyof Cheatsheets;
	exec?: boolean;
}

const configPath = path.resolve(os.homedir(), ".cheatsheet");

if (!fs.existsSync(configPath)) {
	throw new Error("Could not find config file at ~/.cheatsheet");
}

const cheatsheets: Cheatsheets = JSON.parse(
	fs.readFileSync(configPath, "utf-8")
);

const App = (props: AppProps) => {
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
			onSelect={(item) => {
				setCheatsheet(item.value);
			}}
		/>
	);
};

export interface CheatsheetProps {
	exec?: boolean;
	entries: Entries;
}

export const Cheatsheet = (props: CheatsheetProps) => {
	const [state, setState] = React.useState<{
		entry: null | Entry;
		params: null | string[];
	}>({
		entry: null,
		params: null,
	});

	const hasParameters = Boolean(state.params);

	React.useEffect(() => {
		(async () => {
			if (!state.entry) {
				return;
			}

			let { command } = state.entry;

			if (state.params) {
				const answers = await prompts(
					state.params.map((parameter) => ({
						type: "text",
						name: parameter,
						message: parameter,
					}))
				);

				for (const answer of Object.entries(answers)) {
					const [parameter, value] = answer as [string, string];
					command = command.replace(parameter, value);
				}
			}

			const { stdout, stderr } = await execa.command(command);

			console.log("\n======\n");
			console.log("COMMAND:", chalk.green(command), "\n");
			if (stdout) {
				console.log("\n", stdout);
			}

			if (stderr) {
				console.log("\n", stderr);
			}

			console.log("\n======\n");

			setState({
				entry: null,
				params: null,
			});
		})();
	}, [state]);

	return props.exec ? (
		<>
			{hasParameters && (
				<>
					<Text color="yellow">{state.entry?.command}</Text>
					<Newline />
				</>
			)}
			{!hasParameters && (
				<SelectInput
					items={Object.values(props.entries).map((entry) => ({
						label: `${entry.description}: ${entry.command}`,
						value: entry.command,
					}))}
					onSelect={(item) => {
						const entry = props.entries.find((i) => i.command === item.value)!;

						setState({
							entry,
							params: entry.command.match(/<[^>]+>/g),
						});
					}}
				/>
			)}
		</>
	) : (
		<Table
			data={props.entries.map((entry) => ({
				Description: entry.description,
				Command: entry.command,
			}))}
		/>
	);
};

module.exports = App;
export default App;
