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

export enum NodeStatus {
	inactive = 'Inactive',
	active = 'Active',
	busy = 'Busy',
	deleted = 'Deleted'
}

export class NodeView implements vscode.WebviewViewProvider {
	viewId = 'coretex.node';
	private _view?: vscode.WebviewView;

	statusRetryMessage = 'Retrying...'

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

		let dirPath = this.getCLIConfigDir()
		const configDirArray = dirPath.split('\n')

		if (configDirArray.length > 1) {
			dirPath = configDirArray[0]
		}
		
		var watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(vscode.Uri.file(`${dirPath}`), '*.status'));
		watcher.onDidChange(() => {
			this.updateView();
		});
	}

	private updateView(): void {
		if (!this._view) {
			return;
		}

		const nodeVersion = this.checkNodeVersion();
		const text = nodeVersion == '' ? 'Node not started.' : nodeVersion.substring(nodeVersion.indexOf(':') + 1, nodeVersion.length);

		const nodeStatus = this.checkNodeStatus();

		this._view.webview.html = this.getWebviewContent(this._view.webview, text, nodeStatus);

		this._view.webview.onDidReceiveMessage(data => {
			switch (data.type) {
				case 'configure':
					{
						vscode.commands.executeCommand('coretex.configureNode');
						break;
					}
				case 'start':
					{
						if (nodeStatus.includes(NodeStatus.active)) {
							vscode.commands.executeCommand('coretex.stopNode');
						} else if (nodeStatus.includes(NodeStatus.busy)) {
							vscode.window.showInformationMessage("Coretex Node Busy: Stop Runs first.");
						} else {
							vscode.commands.executeCommand('coretex.startNode');
						}
						break;
					}
			}
		});
	}

	private checkNodeVersion(): string {
		const command = 'coretex node version'
		const platform = process.platform;
		if (platform === 'darwin' || platform === 'linux') {
			try {
				const version = child_process.execSync(command);
				return version.toString().replace('}', '');
			} catch (error) {
				return '';
			}
		} else if (platform === 'win32') {
			try {
				const version = child_process.execSync(command);
				return version.toString().replace('}', '');
			} catch (error) {
				try {
					const version = child_process.execSync('coretex.exe node version');
					return version.toString().replace('}', '');
				} catch (error) {
					return '';
				}
			}
		}

		return '';
	}

	private checkNodeStatus(): string {
		const command = 'coretex node status --local'
		const platform = process.platform;
		if (platform === 'darwin' || platform === 'linux') {
			try {
				const status = child_process.execSync(command);
				const statusArray = status.toString().split('\n')
				if (statusArray.length < 1) {
					return ''
				} else {
					return statusArray[0].substring(statusArray[0].indexOf(':') + 1, statusArray[0].length);
				}
			} catch (error) {
				return '';
			}
		} else if (platform === 'win32') {
			try {
				const status = child_process.execSync(command);
				const statusArray = status.toString().split('\n')
				if (statusArray.length < 1) {
					return ''
				} else {
					return statusArray[0].substring(statusArray[0].indexOf(':') + 1, statusArray[0].length);
				}
			} catch (error) {
				try {
					const status = child_process.execSync('coretex.exe node status --local');
					const statusArray = status.toString().split('\n')
					if (statusArray.length < 1) {
						return ''
					} else {
						return statusArray[0].substring(statusArray[0].indexOf(':') + 1, statusArray[0].length);
					}
				} catch (error) {
					return '';
				}
			}
		}

		return '';
	}

	private getCLIConfigDir(): string {
		const command = 'coretex config --user --path'
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
					const version = child_process.execSync('coretex.exe config --user --path');
					return version.toString();
				} catch (error) {
					return '';
				}
			}
		}

		return '';
	}

	private getWebviewContent(webview: vscode.Webview, text: string, status: string): string {
		const viewStyle = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'views.css'));
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'nodeViewScripts.js'));

		// Use a nonce to only allow a specific script to be run.
		const nonce = getNonce();

		let actionMessage = 'Start'

		if (status.includes(NodeStatus.active) || status.includes(NodeStatus.busy)) {
			actionMessage = 'Stop'
		}

		return `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, height="100px" initial-scale=1.0">
				<link href="${viewStyle}" rel="stylesheet">
				<title>Node</title>
			</head>
			<body>
				<p class="title">Status: ${status}</p>
				<button class="configure-action button">Configure</button>
				<button class="start-action button">${actionMessage}</button>
				<p class="title">Node version:</p>
				<p class="subtitle">${text}</p>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>
		`;
	}
}
