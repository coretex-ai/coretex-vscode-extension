// import * as vscode from 'vscode';
// import { parse, ParseError } from 'jsonc-parser';
// import * as fs from 'fs';

// const experimentConfigChecker = vscode.commands.registerCommand(
// 	'coretex.checkExperimentConfig',
// 	async () => {
// 		const configFilePath = vscode.window.activeTextEditor?.document.uri.fsPath;
// 		if (configFilePath) {
// 			const configContent = fs.readFileSync(configFilePath, 'utf-8');
// 			const parseResult = parse(configContent);

// 			if (parseResult) {
// 				const validationResult = validateExperimentConfig(parseResult);
// 				if (validationResult.valid) {
// 					vscode.window.showInformationMessage('Experiment config is valid.');
// 				} else {
// 					vscode.window.showErrorMessage('Experiment config is not valid.');
// 					highlightErrors(validationResult.errors);
// 				}
// 			} else {
// 				const parseErrors = parseResult.errors as ParseError[];
// 				vscode.window.showErrorMessage(
// 					`Failed to parse experiment config: ${parseErrors[0].error}`
// 				);
// 			}
// 		}
// 	}
// );

// function validateExperimentConfig(parsedConfig: any) {
// 	const schemaPath = 'src/syntax/experiment-schema.json'; // Replace with the actual path to your experiment-schema.json file
// 	const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
// 	const schema = JSON.parse(schemaContent);
// 	const ajv = new Ajv();
// 	const validate = ajv.compile(schema);
// 	const valid = validate(parsedConfig);
// 	return { valid, errors: validate.errors };
// }

// function highlightErrors(errors: Ajv.ErrorObject[]) {
// 	const decorationType = vscode.window.createTextEditorDecorationType({
// 		overviewRulerColor: 'red',
// 		overviewRulerLane: vscode.OverviewRulerLane.Right,
// 		light: {
// 			backgroundColor: 'rgba(255, 0, 0, 0.2)',
// 			borderColor: 'red',
// 		},
// 		dark: {
// 			backgroundColor: 'rgba(255, 0, 0, 0.2)',
// 			borderColor: 'red',
// 		},
// 	});

// 	const editor = vscode.window.activeTextEditor;
// 	if (editor) {
// 		const errorRanges: vscode.Range[] = errors.map((error) => {
// 			const { dataPath, message } = error;
// 			const startOffset = configContent.indexOf(dataPath);
// 			const endOffset = startOffset + dataPath.length;
// 			const startPos = editor.document.positionAt(startOffset);
// 			const endPos = editor.document.positionAt(endOffset);
// 			return new vscode.Range(startPos, endPos);
// 		});

// 		editor.setDecorations(decorationType, errorRanges);
// 	}
// }

// export default experimentConfigChecker;
