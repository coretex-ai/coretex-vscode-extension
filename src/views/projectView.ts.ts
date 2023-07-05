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
	}

	private updateView(): void {
		if (!this._view) {
			return;
		}

		const storagePath = this.checkStoragePath();
		const text = storagePath == '' ? 'Storage path not set. Check your configuration.' : storagePath.substring(storagePath.indexOf(':') + 1, storagePath.length);

		this._view.webview.html = this.getWebviewContent(this._view.webview, text);
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

		return `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource};">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${viewStyle}" rel="stylesheet">
				<title>Project</title>
			</head>
			<body>
			<p class="title">Project path:</p>
			<p class="subtitle">${text}</p>
			</body>
			</html>
		`;
	}
}