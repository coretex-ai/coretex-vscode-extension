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
import * as https from 'https';
import * as fs from 'fs-extra';
import * as tmp from 'tmp';
import * as path from 'path';

const installCoretexCLICommand = vscode.commands.registerCommand(
	'coretex.installCoretexCLI',
	async () => {
		let installerURL: string;

		const platform = process.platform;
		if (platform === 'darwin') {
			if (process.arch === 'arm64') {
				installerURL =
					'https://resources.coretex.ai/cli/version/latest/coretex_macos_arm64.pkg';
			} else {
				installerURL =
					'https://resources.coretex.ai/cli/version/latest/coretex_macos_x64.pkg';
			}
		} else if (platform === 'linux') {
			if (process.arch === 'arm64' || process.arch === 'arm') {
				installerURL = 
					'https://resources.coretex.ai/cli/version/latest/coretex_linux_armel.deb'
			} else {
				installerURL =
				'https://resources.coretex.ai/cli/version/latest/coretex_linux_amd64.deb';
			}
		} else {
			vscode.window.showErrorMessage(
				'Coretex CLI installation is not supported on this platform.'
			);
			return;
		}

		vscode.window.withProgress(
			{
				location: vscode.ProgressLocation.Notification,
				title: 'Installing Coretex CLI',
				cancellable: false,
			},
			async (progress, token) => {
				try {
					const tempFile = tmp.fileSync({
						prefix: 'coretex-cli-',
						postfix: '.pkg',
					});
					const downloadFolderPath = path.join(
						process.env.HOME || '',
						'.coretex',
						'cli_install'
					);
					const originalInstallerName = path.basename(tempFile.name);
					const uniqueSuffix = Date.now().toString();
					const installerName = `${originalInstallerName}-${uniqueSuffix}`;
					const downloadPath = path.join(downloadFolderPath, installerName);

					// Create the download folder if it doesn't exist
					await fs.ensureDir(downloadFolderPath);

					progress.report({ message: 'Downloading Coretex CLI installer...' });

					await downloadFile(installerURL, downloadPath, progress);

					progress.report({
						message: 'Coretex CLI installer downloaded successfully.',
					});

					const installOption = await vscode.window.showInformationMessage(
						'Coretex CLI installer downloaded successfully. Do you want to install the CLI?',
						{ modal: true },
						'Yes',
						'No'
					);

					if (installOption === 'Yes') {
						openInstallerFile(downloadPath);
					}

					// Cleanup temporary file
					tempFile.removeCallback();
				} catch (error) {
					vscode.window.showErrorMessage(
						`Failed to download Coretex CLI installer: ${error}`
					);
				}
			}
		);
	}
);

async function downloadFile(
	url: string,
	filePath: string,
	progress: vscode.Progress<{ message?: string; increment?: number }>
) {
	return new Promise<void>((resolve, reject) => {
		const file = fs.createWriteStream(filePath);

		const request = https.get(url, (response) => {
			const totalBytes = Number(response.headers['content-length']);
			let downloadedBytes = 0;

			response.on('data', (chunk) => {
				downloadedBytes += chunk.length;
				progress.report({
					message: 'Downloading Coretex CLI installer...',
					increment: (downloadedBytes / totalBytes) * 100,
				});
				file.write(chunk);
			});

			response.on('end', () => {
				file.end();
				resolve();
			});
		});

		request.on('error', (error) => {
			file.end();
			fs.unlinkSync(filePath);
			reject(error);
		});
	});
}

function openInstallerFile(filePath: string) {
	const terminal = vscode.window.createTerminal();
	const installerFileName = path.basename(filePath);
	const installerDirectory = path.dirname(filePath);
	const installerName = path.basename(
		installerFileName,
		path.extname(installerFileName)
	);

	terminal.sendText(`cd "${installerDirectory}"`);
	terminal.sendText(`mv "${installerFileName}" "${installerName}.pkg"`);
	terminal.sendText(`open "${installerName}.pkg"`);
	terminal.show();
}

export default installCoretexCLICommand;
