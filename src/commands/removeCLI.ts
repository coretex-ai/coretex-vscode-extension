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

const uninstallCoretexCLICommand = vscode.commands.registerCommand(
	'coretex.uninstallCoretexCLI',
	async () => {
		const stopNodeOption = await vscode.window.showInformationMessage(
			'Before uninstalling Coretex CLI, do you want to stop the Coretex node if it is running?',
			{ modal: true },
			'Yes',
			'No'
		);

		if (stopNodeOption === 'Yes') {
			await stopCoretexNode();
		}

		const removeImagesOption = await vscode.window.showInformationMessage(
			'Do you want to remove Docker images associated with the Coretex node to free up space?',
			{ modal: true },
			'Yes',
			'No'
		);

		if (removeImagesOption === 'Yes') {
			await removeCoretexNodeImages();
		}

		const uninstallCLICommand = getUninstallCLICommand();

		// Open the integrated terminal and execute the uninstall CLI command
		vscode.window.terminals.forEach((terminal) => {
			terminal.dispose();
		});
		const terminal = vscode.window.createTerminal();
		terminal.show();
		terminal.sendText(uninstallCLICommand);
	}
);

async function stopCoretexNode(): Promise<void> {
	// Execute the stop node command in the integrated terminal
	const stopNodeCommand = getStopNodeCommand();
	vscode.window.terminals.forEach((terminal) => {
		terminal.dispose();
	});
	const terminal = vscode.window.createTerminal();
	terminal.show();
	terminal.sendText(stopNodeCommand);
}

async function removeCoretexNodeImages(): Promise<void> {
	// Execute the remove images command in the integrated terminal
	const removeImagesCommand = getRemoveImagesCommand();
	vscode.window.terminals.forEach((terminal) => {
		terminal.dispose();
	});
	const terminal = vscode.window.createTerminal();
	terminal.show();
	terminal.sendText(removeImagesCommand);
}

function getStopNodeCommand(): string {
	const platform = process.platform;
	if (platform === 'darwin' || platform === 'linux') {
		return 'coretex node stop';
	} else if (platform === 'win32') {
		return 'coretex.exe node stop';
	}

	throw new Error('Platform not supported.');
}

function getRemoveImagesCommand(): string {
	const platform = process.platform;
	if (platform === 'darwin' || platform === 'linux') {
		return 'coretex node remove';
	} else if (platform === 'win32') {
		return 'coretex.exe node remove';
	}

	throw new Error('Platform not supported.');
}

function getUninstallCLICommand(): string {
	const platform = process.platform;
	if (platform === 'darwin' || platform === 'linux') {
		return 'sudo rm -rf /usr/local/bin/coretex';
	} else if (platform === 'win32') {
		return 'del /f /q "%APPDATA%\\npm\\coretex.cmd"';
	}

	throw new Error('Platform not supported.');
}

export default uninstallCoretexCLICommand;
