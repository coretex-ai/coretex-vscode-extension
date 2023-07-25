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

const listNodesCommand = vscode.commands.registerCommand(
	'coretex.listNodes',
	async () => {
		// Execute the config user command in the integrated terminal
        const command = getNodeListCommand();

        vscode.window.terminals.forEach((terminal) => {
            terminal.dispose();
        });
        const terminal = vscode.window.createTerminal();
        terminal.show();
        terminal.sendText(command);
	}
);

function getNodeListCommand(): string {
	const platform = process.platform;
	if (platform === 'darwin' || platform === 'linux') {
		return 'coretex node list';
	} else if (platform === 'win32') {
		return 'coretex.exe node list';
	}

	throw new Error('Platform not supported.');
}

export default listNodesCommand;
