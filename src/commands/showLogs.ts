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
import * as childProcess from 'child_process';

const showNodeLogsCommand = vscode.commands.registerCommand(
	'coretex.showNodeLogs',
	async () => {
		const outputChannel =
			vscode.window.createOutputChannel('Coretex Node Logs');
		const command = 'coretex node logs';

		const child = childProcess.spawn(command, [], { shell: true });

		child.stdout.on('data', (data) => {
			const output = data.toString();
			outputChannel.append(output);
		});

		child.stderr.on('data', (data) => {
			const error = data.toString();
			outputChannel.append(error);
		});

		child.on('close', () => {
			outputChannel.show();
		});
	}
);

export default showNodeLogsCommand;
