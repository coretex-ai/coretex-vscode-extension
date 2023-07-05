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

import * as vscode from 'vscode';
import { exec, ExecException } from 'child_process';

const startNodeCommand = vscode.commands.registerCommand(
	'coretex.startNode',
	() => {
		vscode.window.withProgress(
			{
				location: vscode.ProgressLocation.Notification,
				title: 'Starting Coretex Node',
				cancellable: false,
			},
			async (progress, token) => {
				progress.report({ message: 'Starting Coretex Node...' });
				return startNode()
			}
		);
	}
);

function startNode() {
	return new Promise<void>((resolve) => {
		exec('docker ps', (error, stdout, stderr) => {
			if (error) {
				vscode.window.showErrorMessage(
					`Failed to list running Docker containers: ${error.message}`
				);
				resolve();
				return;
			}

			if (stderr) {
				vscode.window.showErrorMessage(
					`Error listing running Docker containers: ${stderr}`
				);
				resolve();
				return;
			}

			const containerLines = stdout.trim().split('\n');
			const containerInfo = containerLines.slice(1);

			const coretexNodeRunning = containerInfo.some((line) =>
				line.includes('coretex-node')
			);

			if (coretexNodeRunning) {
				vscode.window.showInformationMessage(
					'Coretex node is already running.'
				);
				resolve();
			} else {
				exec(
					'coretex node start',
					(
						startError: ExecException | null,
						startStdout: string,
						startStderr: string
					) => {
						if (startError) {
							vscode.window.showErrorMessage(
								`Failed to start Coretex node: ${startError.message}`
							);
						} else if (startStderr && !startStdout) {
							// Handle the specific case where only stderr is present and stdout is empty
							vscode.window.showErrorMessage(
								`Error starting Coretex node: ${startStderr}`
							);
						} else {
							const indexOfExitCode = startStdout.indexOf('Exit Code:')
							const exitCode = startStdout.substring(indexOfExitCode + 11, indexOfExitCode + 13)
							if (!exitCode.startsWith('0')) {
								vscode.window.showInformationMessage(
									'Error starting Coretex node: Try re-configuring.'
								);
							} else {
								vscode.window.showInformationMessage(
									'Coretex node started successfully. Activating...'
								);
							}
						}
						resolve();
					}
				);
			}
		});
	});
}

export default startNodeCommand;
