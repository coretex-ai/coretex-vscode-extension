// Copyright (C) 2023  Coretex LLC

// This file is part of Coretex.ai  

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const addParameterCommand = vscode.commands.registerCommand(
	'coretex.addParameter',
	createParameter
);

interface Parameter {
	name: string;
	description: string;
	value: any;
	data_type: string;
	required: boolean;
	optimized: boolean;
}

function createParameter() {
	const parameterName = vscode.window.showInputBox({
		prompt: 'Enter the name of the parameter:',
	});

	return parameterName.then((name) => {
		if (!name) {
			return;
		}

		const parameterType = vscode.window.showQuickPick(
			['int', 'float', 'string', 'bool'],
			{
				placeHolder: 'Select the type of the parameter:',
			}
		);

		return parameterType.then((type) => {
			if (!type) {
				return;
			}

			const parameterValue = vscode.window.showInputBox({
				prompt: 'Enter the value of the parameter:',
			});

			return parameterValue.then((value) => {
				const optimized = vscode.window.showQuickPick(
					[
						{ label: 'No', description: 'Not optimized' },
						{ label: 'Yes', description: 'Optimized' },
					],
					{
						placeHolder: 'Is the parameter optimized?',
						canPickMany: false,
						ignoreFocusOut: true,
					}
				);

				return optimized.then((isOptimized) => {
					const parameter: Parameter = {
						name: name,
						description: isOptimized?.label === 'Yes' ? 'OPTIMIZED: ' : '',
						value: parseValue(value, type),
						data_type: isOptimized?.label === 'Yes' ? `list[${type}]` : type,
						required: false,
						optimized: isOptimized?.label === 'Yes',
					};

					// Get the path to the experiment.config file
					const workspacePath = vscode.workspace.rootPath;
					if (!workspacePath) {
						vscode.window.showErrorMessage('No workspace is opened.');
						return;
					}
					const experimentConfigPath = path.join(
						workspacePath,
						'experiment.config'
					);

					// Read the experiment.config file
					fs.readFile(experimentConfigPath, 'utf8', (err, data) => {
						if (err) {
							vscode.window.showErrorMessage(
								`Failed to read experiment.config: ${err.message}`
							);
							return;
						}

						try {
							// Parse the JSON content of experiment.config
							const config = JSON.parse(data);

							// Add the parameter to the parameters array
							config.parameters = config.parameters || [];
							config.parameters.push(parameter);

							// Write the updated JSON content back to experiment.config
							fs.writeFile(
								experimentConfigPath,
								JSON.stringify(config, null, 2),
								(err) => {
									if (err) {
										vscode.window.showErrorMessage(
											`Failed to update experiment.config: ${err.message}`
										);
										return;
									}

									vscode.window.showInformationMessage(
										'Parameter added successfully!'
									);
								}
							);
						} catch (err: any) {
							vscode.window.showErrorMessage(
								`Failed to parse experiment.config: ${err.message}`
							);
						}
					});
				});
			});
		});
	});
}

function parseValue(value: string | undefined, type: string): any {
	if (type === 'int') {
		return parseInt(value!);
	} else if (type === 'float') {
		return parseFloat(value!);
	} else if (type === 'bool') {
		return value === 'Yes' || value === 'true';
	} else {
		return value;
	}
}

export default addParameterCommand;
