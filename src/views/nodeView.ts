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
import * as fs from 'fs';

export enum NodeStatus {
	inactive = 'Inactive',
	active = 'Active',
	busy = 'Busy',
	deleted = 'Deleted'
}

export class NodeView implements vscode.WebviewViewProvider {
	viewId = 'coretex.node';
	private _view?: vscode.WebviewView;

	private statusRetryMessage = 'Retrying...'
	private statusErrorMessage = 'There was an error. Check your arguments or try authenticating with config command.'

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
		
		const storage = this.checkStoragePath();

		// parse checkStoragePath() return format
		let storagePath = storage.substring(storage.indexOf(':') + 1, storage.length);
		const storageDirArray = storagePath.split('\n');

		if (storageDirArray.length > 1) {
			storagePath = storageDirArray[0];
		}

		const nodeFile = storagePath.endsWith('/') ? 'node' : '/node'
		const storageNodePath = storagePath.replace(' ', '') + nodeFile

		// Watch for status changes
		var watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(vscode.Uri.file(`${storageNodePath}`), '*.status'));
		watcher.onDidChange(() => {
			this.updateView();
		});

		this._view.webview.onDidReceiveMessage(data => {
			this.runCommand(data);
		});
	}

	private updateView(): void {
		if (!this._view) {
			return;
		}

		const nodeVersion = this.checkNodeVersion();
		const text = nodeVersion == '' ? 'Node not started.' : nodeVersion.substring(nodeVersion.indexOf(':') + 1, nodeVersion.length); // parse version return format
		let nodeStatus = this.checkNodeStatus();

		// Handle response error format
		if (nodeStatus.includes(this.statusErrorMessage)) {
			nodeStatus = 'Inactive'
		}

		this._view.webview.html = this.getWebviewContent(this._view.webview, text, nodeStatus);
	}

	private runCommand(data: any) {
		switch (data.type) {
			case 'configure':
				{
					vscode.commands.executeCommand('workbench.action.openSettings', 'Coretex');
					vscode.commands.executeCommand('coretex.configureNode');
					break;
				}
			case 'start':
				{
					const configPath = this.getConfigDirString();
					const configJson = 'config.json';
					const dockerScript = 'docker.sh';
					const dockerYaml = 'docker-compose.yml';

					if (fs.existsSync(configPath + `/${configJson}`) && fs.existsSync(configPath + `/${dockerScript}`) && fs.existsSync(configPath + `/${dockerYaml}`)) {
						this.startNode(this.checkNodeStatus());
					} else {
						vscode.window.showInformationMessage("Coretex Node: Config not complete. Configuring...");
						vscode.commands.executeCommand('coretex.configureNode');
					}
					break;
				}
		}
	}

	private startNode(nodeStatus: string) {
		if (nodeStatus.includes(NodeStatus.active)) {
			vscode.commands.executeCommand('coretex.stopNode');
		} else if (nodeStatus.includes(NodeStatus.busy)) {
			vscode.window.showInformationMessage("Coretex Node Busy: Stop Runs first.");
		} else {
			vscode.commands.executeCommand('coretex.startNode');
		}
	}

	private checkStoragePath(): string {
		const platform = process.platform;
		const command = 'coretex storage'
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
					const version = child_process.execSync('coretex.exe storage');
					return version.toString();
				} catch (error) {
					return '';
				}
			}
		}

		return '';
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

	private getConfigDirString(): string {
		let dirPath = this.getCLIConfigDir();

		// parse getCLIConfigDir() return format
		const configDirArray = dirPath.split('\n');

		if (configDirArray.length > 1) {
			dirPath = configDirArray[0];
		}

		return dirPath
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
				<div class="content">
					<button class="start-action button">${actionMessage}</button>
					<span class="configure-action">&#9881;</span>
				</div>
				<p class="title">Node version:</p>
				<p class="subtitle">${text}</p>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>
		`;
	}
}
