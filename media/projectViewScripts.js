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

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
    const vscode = acquireVsCodeApi();

    document.querySelector('.start-action').addEventListener('click', () => {
        onStartClicked();
    });

    document.querySelector('.update-action-new').addEventListener('click', () => {
        onListNodesClicked();
    });

    function onStartClicked() {
        vscode.postMessage({ type: 'start'});
    }

    function onListNodesClicked() {
        vscode.postMessage({ type: 'nodes'});
    }
}());

