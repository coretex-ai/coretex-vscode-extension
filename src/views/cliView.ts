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
import { getNonce } from '../utilities/getNonce';

export class CLIView implements vscode.WebviewViewProvider {
	viewId = 'coretex.cli';
	private _view?: vscode.WebviewView;

	constructor(private readonly _extensionUri: vscode.Uri) {}

	public resolveWebviewView(webviewView: vscode.WebviewView): void {
		this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this._extensionUri
			]
		};

		this.updateView();

		this._view.onDidChangeVisibility(async event => {
			this.updateView();
		});
	}

	private updateView(): void {
		if (!this._view) {
			return;
		}

		const cliVersion = this.isCoretexCLIInstalled();
		const isNewVersionAvailable = this.isNewVersionAvailable();

		if (isNewVersionAvailable) {
			vscode.window.showInformationMessage("Coretex CLI: New Version Available!");
		}

		this._view.webview.html = this.getWebviewContent(this._view.webview, cliVersion, isNewVersionAvailable);

		this._view.webview.onDidReceiveMessage(data => {
			switch (data.type) {
				case 'update':
					{
						vscode.commands.executeCommand('coretex.installCoretexCLI');
						break;
					}
			}
		});
	}

	private isCoretexCLIInstalled(): string {
		const command = 'coretex --version'
		const platform = process.platform;
		if (platform === 'darwin' || platform === 'linux') {
			try {
				const version = child_process.execSync(command);
				return version.toString();
			} catch (error) {
				return '';
			}
		} else if (platform === 'win32') {
			try {
				const version = child_process.execSync(command);
				return version.toString();
			} catch (error) {
				try {
					const version = child_process.execSync('coretex.exe --version');
					return version.toString();
				} catch (error) {
					return '';
				}
			}
		}

		return '';
	}

	private isNewVersionAvailable(): boolean {
		const command = 'coretex update --check'
		const newVersionMessage = 'New Version Available.'
		const platform = process.platform;
		if (platform === 'darwin' || platform === 'linux') {
			try {
				const version = child_process.execSync(command);
				return version.toString().includes(newVersionMessage);
			} catch (error) {
				return false;
			}
		} else if (platform === 'win32') {
			try {
				const version = child_process.execSync(command);
				return version.toString().includes(newVersionMessage)
			} catch (error) {
				try {
					const version = child_process.execSync(command);
					return version.toString().includes('coretex.exe update --check')
				} catch (error) {
					return false;
				}
			}
		}

		return false;
	}

	private getWebviewContent(webview: vscode.Webview, cliVersion: string, isNewVersionAvailable: boolean): string {
		const viewStyle = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'views.css'));
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'cliViewScripts.js'));

		const text = cliVersion == '' ? 'CLI Not Installed.' : cliVersion;
		const updateButtonText = cliVersion == '' ? 'Install' : 'Update';
		const updateButtonStyle = isNewVersionAvailable ? 'update-action-new' : 'update-action';

		// Use a nonce to only allow a specific script to be run.
		const nonce = getNonce();

		return `<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<link href="${viewStyle}" rel="stylesheet">
			<title>CLI</title>
		</head>
		<body>
			<p class="title">Currently installed version:</p>
			<p class="subtitle">${text}</p>
			<button class="${updateButtonStyle} button">${updateButtonText}</button>
			<script nonce="${nonce}" src="${scriptUri}"></script>
		</body>
		</html>`;
	}
}
