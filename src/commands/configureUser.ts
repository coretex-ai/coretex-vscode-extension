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

import { ExecException, exec } from 'child_process';
import * as vscode from 'vscode';

interface IUserConfigData {
	email: string,
	password: string
	storagePath: string
}

const configureUserCommand = vscode.commands.registerCommand(
	'coretex.configureUser',
	async () => {
		const storagePathConf = 'StoragePath'
		const emailConf = 'Email'

		const email = await vscode.window.showInputBox({
			prompt: 'Enter your Coretex email',
			placeHolder: 'Email',
			validateInput: (value) => (value ? null : 'Email is required'),
			value: '', // Default value
		});

		if (!email) {
			vscode.window.showErrorMessage(
				'Email is required to log in.'
			);
			return;
		}

        const password = await vscode.window.showInputBox({
			prompt: 'Enter your Coretex password',
			placeHolder: 'Password',
			validateInput: (value) => (value ? null : 'Password is required'),
			value: '', // Default value
		});

		if (!password) {
			vscode.window.showErrorMessage(
				'Password is required to log in.'
			);
			return;
		}

		const conf = vscode.workspace.getConfiguration();
		const defaultStoragePath = require('os').homedir() + '/.coretex'

		const storage = conf.get<{}>(storagePathConf)
		const storageDefaultValue = storage ? storage.toString() : ''

		const storagePath = await vscode.window.showInputBox({
			prompt: 'Enter the storage path',
			placeHolder: 'Storage Path (e.g., ~/.coretex)',
			value: storageDefaultValue != '' ? storageDefaultValue : defaultStoragePath, // Default value
		});

		if (!storagePath) {
			vscode.window.showErrorMessage(
				'Storage path is required to login.'
			);
			return;
		}

		const userConfigData: IUserConfigData = {
			email,
			password,
			storagePath
		};

		await login(userConfigData, storagePathConf, emailConf, storagePath)
	}
);

async function login(params: IUserConfigData, storagePathConf: string, emailConf: string, storagePath: string): Promise<void>  {
	const configUserBaseCommand = getConfigUserCommand();

	const email = `--email=${params.email}`
	const password = `--password=${params.password}`
	const storage = `--storage=${params.storagePath}`

	const configUserCommand = `${configUserBaseCommand} ${email} ${password} ${storage}`

	exec(
		`${configUserCommand}`,
		(
			loginError: ExecException | null,
			loginStdout: string,
			loginStderr: string
		) => {
			if (loginError) {
				vscode.window.showErrorMessage(
					`Failed to login: ${loginError.message}`
				);
			} else if (loginStderr && !loginStdout) {
				// Handle the specific case where only stderr is present and stdout is empty
				vscode.window.showErrorMessage(
					`Error logging in: ${loginStderr}`
				);
			} else {
				// Handle network response return format
				if (loginStdout.includes('Request failed')) {
					vscode.window.showInformationMessage(
						'Login failed, please check your credentials.'
					);
				} else {
					vscode.workspace.getConfiguration().update(emailConf, params.email, vscode.ConfigurationTarget.Global);
					vscode.workspace.getConfiguration().update(storagePathConf, storagePath, vscode.ConfigurationTarget.Global);

					vscode.window.showInformationMessage(
						'Coretex user logged in successfully.'
					);
				}
			}
		}
	);
}

async function configCoretexUser(params: IUserConfigData): Promise<void> {
	// Execute the config user command in the integrated terminal
	const configUserBaseCommand = getConfigUserCommand();

	const email = `--email=${params.email}`
	const password = `--password=${params.password}`
	const storage = `--storage=${params.storagePath}`

	const configUserCommand = `${configUserBaseCommand} ${email} ${password} ${storage}`
	vscode.window.terminals.forEach((terminal) => {
		terminal.dispose();
	});
	const terminal = vscode.window.createTerminal();
	terminal.show();
	terminal.sendText(configUserCommand);
}

function getConfigUserCommand(): string {
	const platform = process.platform;
	if (platform === 'darwin' || platform === 'linux') {
		return 'coretex config --user --force';
	} else if (platform === 'win32') {
		return 'coretex.exe config --user --force';
	}

	throw new Error('Platform not supported.');
}

export default configureUserCommand;
