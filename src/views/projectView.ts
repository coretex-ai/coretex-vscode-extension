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

export class ProjectView implements vscode.WebviewViewProvider {
	viewId = 'coretex.project';
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

		this._view.webview.onDidReceiveMessage(data => {
			this.runCommand(data);
		});
	}

	private updateView(): void {
		if (!this._view) {
			return;
		}

		const storagePath = this.checkStoragePath();
		const text = storagePath == '' ? 'Storage path not set. Check your configuration.' : storagePath.substring(storagePath.indexOf(':') + 1, storagePath.length);

		this._view.webview.html = this.getWebviewContent(this._view.webview, text);
	}
	
	private getRunCommand(project: number, node: number, path: string): string {
		const platform = process.platform;
		if (platform === 'darwin' || platform === 'linux') {
			return `coretex run create ${node} -s ${project} -f ${path}`;
		} else if (platform === 'win32') {
			return `coretex.exe run create ${node} -s ${project} -f ${path}`;
		}

		return '';
	}

	private async runCommand(data: any) {
		switch (data.type) {
			case 'start':
				{
					const projectConf = 'Project';
					const nodeConf = 'NodeID';

					const conf = vscode.workspace.getConfiguration();
					const projectID = conf.get<{}>(projectConf);
					const projectDefaultValue = projectID ? projectID.toString() : '';

					const project = await vscode.window.showInputBox({
						prompt: 'Enter Project ID in which you wish to run the Task',
						placeHolder: 'Project',
						validateInput: (value) => (value ? null : 'Project is required'),
						value: projectDefaultValue, // Default value
					});
			
					if (!project) {
						vscode.window.showErrorMessage(
							'Project is required to run a Task.'
						);
						return;
					}

					const nodeID = conf.get<{}>(nodeConf);
					const nodeDefaultValue = nodeID ? nodeID.toString() : '';

					const node = await vscode.window.showInputBox({
						prompt: 'Enter Node ID on which you wish to run the Task',
						placeHolder: 'Node',
						validateInput: (value) => (value ? null : 'Node is required'),
						value: nodeDefaultValue, // Default value
					});
			
					if (!node) {
						vscode.window.showErrorMessage(
							'Node is required to run a Task.'
						);
						return;
					}

					let currentWorkspacePath = '';

					if (vscode.workspace.workspaceFolders) {
						currentWorkspacePath = vscode.workspace.workspaceFolders[0].uri.path;
					}
					
					const command = this.getRunCommand(Number(project), Number(node), currentWorkspacePath);

					vscode.window.terminals.forEach((terminal) => {
						terminal.dispose();
					});
					const terminal = vscode.window.createTerminal();
					terminal.show();
					terminal.sendText(command);
					break;
				}
			case 'nodes':
				{
					vscode.commands.executeCommand('coretex.listNodes');
				}
		}
	}

	private checkStoragePath(): string {
		const platform = process.platform;
		if (platform === 'darwin' || platform === 'linux') {
			try {
				const version = child_process.execSync('coretex storage');
				return version.toString();
			} catch (error) {
				return '';
			}
		} else if (platform === 'win32') {
			try {
				const version = child_process.execSync('coretex storage');
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

	private getWebviewContent(webview: vscode.Webview, text: string): string {
		const viewStyle = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'views.css'));
		const runStyle = 'start-action button'
		const nodesStyle = 'update-action-new  button'

		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'projectViewScripts.js'));

		// Use a nonce to only allow a specific script to be run.
		const nonce = getNonce();

		return `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource};  script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${viewStyle}" rel="stylesheet">
				<title>Project</title>
			</head>
			<body>
				<p>Run a Task with the current workspace contents:</p>
				<button class="${runStyle}">Run Task</button>
				<p>List nodes available for Task execution (set default in global extension settings):</p>
				<button class="${nodesStyle}">List Nodes</button>
				<p class="title">Storage path:</p>
				<p class="subtitle">${text}</p>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>
		`;
	}
}