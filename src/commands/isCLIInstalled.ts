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
import * as child_process from 'child_process';

const checkCoretexCLIInstalledCommand = vscode.commands.registerCommand(
	'coretex.checkCoretexCLIInstalled',
	async () => {
		const isInstalled = isCoretexCLIDetected();
		if (isInstalled) {
			vscode.window.showInformationMessage(
				'Coretex CLI is installed on the system.'
			);
		} else {
			vscode.window.showWarningMessage(
				'Coretex CLI is not installed on the system.'
			);
		}
	}
);

function isCoretexCLIDetected(): boolean {
	const platform = process.platform;
	if (platform === 'darwin' || platform === 'linux') {
		try {
			child_process.execSync('coretex --version');
			return true;
		} catch (error) {
			return false;
		}
	} else if (platform === 'win32') {
		try {
			child_process.execSync('coretex --version');
			return true;
		} catch (error) {
			try {
				child_process.execSync('coretex.exe --version');
				return true;
			} catch (error) {
				return false;
			}
		}
	}

	return false;
}

export default checkCoretexCLIInstalledCommand;
