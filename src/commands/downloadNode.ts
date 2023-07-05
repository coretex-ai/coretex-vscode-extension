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
import { window, Terminal } from 'vscode';

const downloadNodeImageCommand = vscode.commands.registerCommand(
	'coretex.downloadNodeImage',
	async () => {
		const downloadOption = await vscode.window.showInformationMessage(
			'Do you want to download the Coretex Node Docker image?',
			{ modal: true },
			'Yes',
			'No'
		);

		if (downloadOption === 'Yes') {
			const startNodeOption = await vscode.window.showInformationMessage(
				'Do you want to start the Coretex Node once download is complete?',
				{ modal: true },
				'Yes',
				'No'
			);

			const terminal: Terminal = window.createTerminal('Coretex Download');
			terminal.show();

			const command = startNodeOption === 'Yes' ? 'coretex node download && coretex node start' : 'coretex node download'

			terminal.sendText(command);
		}
	}
);

export default downloadNodeImageCommand;
