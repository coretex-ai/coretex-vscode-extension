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
import * as path from 'path';
import * as fs from 'fs';

const convertToCoretexProject = vscode.commands.registerCommand(
	'coretex.convertToCoretexProject',
	async () => {
		const activeEditor = vscode.window.activeTextEditor;
		if (!activeEditor) {
			vscode.window.showErrorMessage('No active editor found.');
			return;
		}

		const workspaceFolder = vscode.workspace.getWorkspaceFolder(
			activeEditor.document.uri
		);
		if (!workspaceFolder) {
			vscode.window.showErrorMessage('No workspace folder found.');
			return;
		}

		const experimentConfigPath = path.join(
			workspaceFolder.uri.fsPath,
			'experiment.config'
		);
		const requirementsFilePath = path.join(
			workspaceFolder.uri.fsPath,
			'requirements.txt'
		);

		const isCompliant = checkCompliance(
			experimentConfigPath,
			requirementsFilePath
		);
		if (isCompliant) {
			vscode.window.showInformationMessage(
				'The project is already compliant with the Coretex project structure.'
			);
			return;
		}

		try {
			const entryScriptUri = await vscode.window.showOpenDialog({
				canSelectFiles: true,
				canSelectFolders: false,
				canSelectMany: false,
				openLabel: 'Select Entry Script',
			});

			if (!entryScriptUri || entryScriptUri.length === 0) {
				return;
			}

			const entryScriptPath = entryScriptUri[0].fsPath;
			const entryScriptContent = fs.readFileSync(entryScriptPath, 'utf-8');

			const isEntryScriptCompliant =
				checkEntryScriptCompliance(entryScriptContent);
			if (!isEntryScriptCompliant) {
				const fixedEntryScriptContent =
					fixEntryScriptCompliance(entryScriptContent);
				fs.writeFileSync(entryScriptPath, fixedEntryScriptContent);
				vscode.window.showInformationMessage(
					'The selected entry script has been made compliant.'
				);
			}

			const projectTaskInput = await vscode.window.showQuickPick(
				[
					{ label: 'Motion Recognition', value: 1 },
					{ label: 'Computer Vision', value: 2 },
					{ label: 'Bioinformatics', value: 3 },
					{ label: 'Other', value: 8 },
				],
				{
					placeHolder: 'Select the project task:',
				}
			);

			if (!projectTaskInput) {
				return;
			}

			const projectTask = projectTaskInput.value;

			const projectDescriptionInput = await vscode.window.showInputBox({
				prompt: 'Enter a brief project description (optional):',
				placeHolder: 'Project Description',
			});

			const projectDescription = projectDescriptionInput || '-';

			const experimentConfigContent = generateExperimentConfigContent(
				projectTask,
				projectDescription
			);
			fs.writeFileSync(experimentConfigPath, experimentConfigContent);

			const mainPythonFileContent =
				generateMainPythonFileContent(entryScriptContent);
			fs.writeFileSync(entryScriptPath, mainPythonFileContent);

			// Add coretex dependency to requirements.txt if it doesn't exist
			addCoretexDependency(requirementsFilePath);

			vscode.window.showInformationMessage(
				'Project has been converted to Coretex format.'
			);
		} catch (error) {
			vscode.window.showErrorMessage(
				`Failed to convert project to Coretex format: ${error}`
			);
		}
	}
);

function fixEntryScriptCompliance(entryScriptContent: string): string {
	const entryScriptLines = entryScriptContent
		.split('\n')
		.map((line) => line.trim());

	const fixedEntryScriptLines = entryScriptLines.map((line) => {
		if (line.startsWith('print(')) {
			// Replace print statements with logger.info
			return line.replace('print(', 'logger.info(');
		} else {
			return line;
		}
	});

	const fixedEntryScriptContent = fixedEntryScriptLines.join('\n');

	const expectedEntryScriptContent = `from coretex import CustomDataset, ExecutingExperiment
from coretex.project import initializeProject
import logging

logger = logging.getLogger(__name__)

${fixedEntryScriptContent}`;

	return expectedEntryScriptContent;
}

function checkCompliance(
	experimentConfigPath: string,
	requirementsFilePath: string
): boolean {
	const isExperimentConfigExists = fs.existsSync(experimentConfigPath);
	const hasCoretexDependency = checkCoretexDependency(requirementsFilePath);

	return isExperimentConfigExists && hasCoretexDependency;
}

function checkCoretexDependency(requirementsFilePath: string): boolean {
	if (fs.existsSync(requirementsFilePath)) {
		const requirementsContent = fs.readFileSync(requirementsFilePath, 'utf-8');
		return requirementsContent.includes('coretex');
	}
	return false;
}

function checkEntryScriptCompliance(entryScriptContent: string): boolean {
	const entryScriptLines = entryScriptContent
		.split('\n')
		.map((line) => line.trim());

	const isImportsPresent = entryScriptLines.some(
		(line) =>
			line.startsWith('from coretex') || line.startsWith('import coretex')
	);
	const isMainFunctionPresent = entryScriptLines.includes(
		'def main(experiment: ExecutingExperiment[CustomDataset]):'
	);
	const isInitializeProjectPresent = entryScriptLines.includes(
		'initializeProject(main)'
	);
	const isMainModuleCheckPresent = entryScriptLines.includes(
		'if __name__ == "__main__":'
	);

	return (
		isImportsPresent &&
		isMainFunctionPresent &&
		isInitializeProjectPresent &&
		isMainModuleCheckPresent
	);
}

function generateExperimentConfigContent(
	projectTask: number,
	projectDescription: string
): string {
	return `{
    "name": "${path.basename(vscode.workspace.rootPath!)}",
    "description": "${projectDescription}",
    "project_task": ${projectTask},
    "is_active": true,
    "version": 1,
    "parameters": []
}`;
}

function generateMainPythonFileContent(entryScriptContent: string): string {
	const updatedEntryScriptContent = entryScriptContent.replace(
		/print\(/g,
		'logger.info('
	);

	return `from coretex import CustomDataset, ExecutingExperiment
from coretex.project import initializeProject
import logging

logger = logging.getLogger(__name__)

def main(experiment: ExecutingExperiment[CustomDataset]):
    ${updatedEntryScriptContent}

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    initializeProject(main)
`;
}

function addCoretexDependency(requirementsFilePath: string): void {
	const coretexDependency = 'coretex';

	if (fs.existsSync(requirementsFilePath)) {
		const requirementsContent = fs.readFileSync(requirementsFilePath, 'utf-8');
		if (!requirementsContent.includes(coretexDependency)) {
			fs.appendFileSync(requirementsFilePath, `\n${coretexDependency}`);
		}
	} else {
		fs.writeFileSync(requirementsFilePath, coretexDependency);
	}
}

export default convertToCoretexProject;
