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
import { exec } from 'child_process';

let checkNodeStatusCommand = vscode.commands.registerCommand(
	'coretex.checkNodeStatus',
	() => {
		exec('docker ps', (error, stdout, stderr) => {
			if (error) {
				vscode.window.showErrorMessage(
					`Failed to list running Docker containers: ${error.message}`
				);
				return;
			}

			if (stderr) {
				vscode.window.showErrorMessage(
					`Error listing running Docker containers: ${stderr}`
				);
				return;
			}

			const containerLines = stdout.trim().split('\n');

			const coretexNodeRunning = containerLines.some((line) =>
				line.includes('coretex-node')
			);

			if (coretexNodeRunning) {
				vscode.window.showInformationMessage('Coretex node is running.');
			} else {
				vscode.window.showWarningMessage('Coretex node is not running.');
			}
		});
	}
);

export default checkNodeStatusCommand;
