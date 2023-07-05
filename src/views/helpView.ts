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

export class HelpView implements vscode.WebviewViewProvider {
	viewId = 'coretex.help';
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

		this._view.webview.html = this.getWebviewContent(this._view.webview);
	}

	private getWebviewContent(webview: vscode.Webview): string {
		const viewStyle = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'views.css'));

		return `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource};">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${viewStyle}" rel="stylesheet">
				<title>Help</title>
			</head>
			<body>
			<p class="subtitle"><a href="https://docs.coretex.ai/v1/getting-started/demo-experiments">Tutorials</a></p>
            <p class="subtitle"><a href="https://docs.coretex.ai/v1/getting-started/learn-basics/space-and-project">Basic project structure</a></p>
			</body>
			</html>
		`;
	}
}