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

interface INodeConfigData {
	nodeName: string,
	storagePath: string
	image: string,
	organizationID: string,
	memLimit: string,
	memSwapLimit: string,
	shmSize: string,
}

const configureNodeCommand = vscode.commands.registerCommand(
	'coretex.configureNode',
	async () => {
		const nodeNameConf = 'NodeName'
		const storagePathConf = 'StoragePath'
		const organizationConf = 'OrganizationID'

		const conf = vscode.workspace.getConfiguration();

		const node = conf.get<{}>(nodeNameConf)
		const nodeDefaultValue = node ? node.toString() : ''

		const nodeName = await vscode.window.showInputBox({
			prompt: 'Enter the node name',
			placeHolder: 'Node Name',
			validateInput: (value) => (value ? null : 'Node name is required'),
			value: nodeDefaultValue, // Default value
		});

		if (!nodeName) {
			vscode.window.showErrorMessage(
				'Node name is required to configure the Coretex node.'
			);
			return;
		}

		const defaultStoragePath = require('os').homedir() + '/.coretex'

		const storage = conf.get<{}>(storagePathConf)
		const storageDefaultValue = storage ? storage.toString() : ''

		const storagePath = await vscode.window.showInputBox({
			prompt: 'Enter the storage path',
			placeHolder: 'Storage Path (e.g., ~/.coretex)',
			value: storageDefaultValue != '' ? storageDefaultValue : defaultStoragePath, // Default value
		});

		if (!storagePath) {
			vscode.window.showErrorMessage(
				'Storage path is required to configure the Coretex node.'
			);
			return;
		}

		const orgID = conf.get<{}>(organizationConf)
		const orgDefaultValue = orgID ? orgID.toString() : ''

		const organizationID = await vscode.window.showInputBox({
			prompt: 'Enter the organization ID',
			placeHolder: 'Organization ID',
			value: orgDefaultValue, // default value
			validateInput: (value) => (value ? null : 'Organization ID is required'),
		});

		if (!organizationID) {
			vscode.window.showErrorMessage(
				'Organization ID is required to configure the Coretex node.'
			);
			return;
		}

		const memLimit = await vscode.window.showInputBox({
			prompt: 'Enter the memory limit in GB',
			placeHolder: '15',
			value: '15', // Default value
		});

		if (!memLimit) {
			vscode.window.showErrorMessage(
				'Memory limit is required to configure the Coretex node.'
			);
			return;
		}

		const memSwapLimit = await vscode.window.showInputBox({
			prompt: 'Enter the memory swap limit in GB',
			placeHolder: '15',
			value: '15', // Default value
		});

		if (!memSwapLimit) {
			vscode.window.showErrorMessage(
				'Swap memory limit is required to configure the Coretex node.'
			);
			return;
		}

		const shmSize = await vscode.window.showInputBox({
			prompt: 'Enter the shared memory size in GB',
			placeHolder: '9',
			value: '9', // Default value
		});

		if (!shmSize) {
			vscode.window.showErrorMessage(
				'Shared memory limit is required to configure the Coretex node.'
			);
			return;
		}

		const image = await vscode.window.showInputBox({
			prompt: 'Enter the type of image you want to use? ("gpu" or "cpu")',
			placeHolder: 'cpu',
			value: 'cpu', // Default value
		});

		if (!image) {
			vscode.window.showErrorMessage(
				'Image is required to configure the Coretex node.'
			);
			return;
		}

		const nodeConfigData: INodeConfigData = {
			nodeName,
			storagePath,
			image: image,
			organizationID,
			memLimit,
			memSwapLimit,
			shmSize,
		};

		await configCoretexNode(nodeConfigData)

		vscode.workspace.getConfiguration().update(storagePathConf, storagePath, vscode.ConfigurationTarget.Global);
		vscode.workspace.getConfiguration().update(nodeNameConf, nodeName, vscode.ConfigurationTarget.Global);

		vscode.window.showInformationMessage(
			'Coretex node configuration completed successfully. Restart the node to apply the changes.'
		);
	}
);

async function configCoretexNode(params: INodeConfigData): Promise<void> {
	// Execute the config node command in the integrated terminal
	const configNodeBaseCommand = getConfigNodeCommand();

	const nodename = `--nodename=${params.nodeName}`
	const organization = `--organization=${params.organizationID}`
	const storage = `--storage=${params.storagePath}`
	const ram = `--ram=${params.memLimit}`
	const swap = `--swap=${params.memSwapLimit}`
	const shm = `--shm=${params.shmSize}`
	const image = `--image=${params.image}`

	const configNodeCommand = `${configNodeBaseCommand} ${nodename} ${organization} ${storage} ${ram} ${swap} ${shm} ${image}`
	vscode.window.terminals.forEach((terminal) => {
		terminal.dispose();
	});
	const terminal = vscode.window.createTerminal();
	terminal.show();
	terminal.sendText(configNodeCommand);
}

function getConfigNodeCommand(): string {
	const platform = process.platform;
	if (platform === 'darwin' || platform === 'linux') {
		return 'coretex config --node';
	} else if (platform === 'win32') {
		return 'coretex.exe config --node';
	}

	throw new Error('Platform not supported.');
}

export default configureNodeCommand;
