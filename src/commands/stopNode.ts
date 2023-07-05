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

const stopNodeCommand = vscode.commands.registerCommand(
	'coretex.stopNode',
	() => {
		vscode.window.withProgress(
			{
				location: vscode.ProgressLocation.Notification,
				title: 'Stopping Coretex Node',
				cancellable: false,
			},
			async (progress, token) => {
				progress.report({ message: 'Stopping Coretex Node...' });
				return stopNode()
			}
		);
	}
);

function stopNode() {
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
				exec(
					'coretex node stop',
					(
						stopError: ExecException | null,
						stopStdout: string,
						stopStderr: string
					) => {
						if (stopError) {
							vscode.window.showErrorMessage(
								`Failed to stop Coretex node: ${stopError.message}`
							);
						} else if (stopStderr) {
							vscode.window.showErrorMessage(
								`Error stopping Coretex node: ${stopStderr}`
							);
						} else {
							vscode.window.showInformationMessage(
								'Coretex node stopped successfully.'
							);
						}
						resolve();
					}
				);
			} else {
				vscode.window.showInformationMessage(
					'Coretex node is not running.'
				);
				resolve();
			}
		});
	});
}

export default stopNodeCommand;
