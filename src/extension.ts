import * as vscode from 'vscode';

import startNodeCommand from './commands/startNode';
import checkNodeStatusCommand from './commands/checkNodeStatus';
import stopNodeCommand from './commands/stopNode';
import configureNodeCommand from './commands/configureNode';
import downloadNodeImageCommand from './commands/downloadNode';
import installCoretexCLICommand from './commands/installCLI';
import checkCoretexCLIInstalledCommand from './commands/isCLIInstalled';
import uninstallCoretexCLICommand from './commands/removeCLI';
import convertToCoretexProject from './commands/convertToCoretexProject';
import openDocumentationCommand from './commands/openDocumentation';
import openDocumentationPythonLibCommand from './commands/openDocumentationPythonLib';
import addParameterCommand from './commands/addParameter';
import showNodeLogsCommand from './commands/showLogs';
import configureUserCommand from './commands/configureUser';

import {CLIView} from './views/cliView';
import {NodeView} from './views/nodeView';
import {ProjectView} from './views/projectView.ts';
import { HelpView } from './views/helpView';
import { UserView } from './views/userView';

export function activate(context: vscode.ExtensionContext) {
	// COMMANDS

	context.subscriptions.push(startNodeCommand);
	context.subscriptions.push(checkNodeStatusCommand);
	context.subscriptions.push(stopNodeCommand);
	context.subscriptions.push(configureNodeCommand);
	context.subscriptions.push(downloadNodeImageCommand);
	context.subscriptions.push(installCoretexCLICommand);
	context.subscriptions.push(checkCoretexCLIInstalledCommand);
	context.subscriptions.push(uninstallCoretexCLICommand);
	context.subscriptions.push(convertToCoretexProject);
	context.subscriptions.push(openDocumentationCommand);
	context.subscriptions.push(openDocumentationPythonLibCommand);
	context.subscriptions.push(addParameterCommand);
	context.subscriptions.push(showNodeLogsCommand);
	context.subscriptions.push(configureUserCommand);

	// VIEWS

	const userView = vscode.window.registerWebviewViewProvider(
		'coretex.user',
		new UserView(context.extensionUri)
	);

	const cliView = vscode.window.registerWebviewViewProvider(
		'coretex.cli',
		new CLIView(context.extensionUri)
	);

	const nodeView = vscode.window.registerWebviewViewProvider(
		'coretex.node',
		new NodeView(context.extensionUri)
	);

	const projectView = vscode.window.registerWebviewViewProvider(
		'coretex.project',
		new ProjectView(context.extensionUri)
	);

	const helpView = vscode.window.registerWebviewViewProvider(
		'coretex.help',
		new HelpView(context.extensionUri)
	);

	context.subscriptions.push(userView);
	context.subscriptions.push(cliView);
	context.subscriptions.push(nodeView);
	context.subscriptions.push(projectView);
	context.subscriptions.push(helpView);
}
