import * as vscode from 'vscode';
import * as cp from 'child_process';
import { startServer } from './server';
import { Client } from './client';
import { ClengaEditorProvider, View } from './views';

let server: cp.ChildProcessWithoutNullStreams;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	server = startServer(context.extensionPath);
	var client = new Client();

	initServerWorkspace(client);

	// context.subscriptions.push(vscode.commands.registerCommand('tpp-extension.setStructuredView', () => {
	// 	vscode.window.showInformationMessage('view change!');
	// }));

	context.subscriptions.push(ClengaEditorProvider.register(context, client));
}

export function deactivate() {
	server.kill();
}

function initServerWorkspace(client: Client) {
	var workDirFolders = vscode.workspace.workspaceFolders;
	var rootNodeToml: string = "";
	vscode.workspace.findFiles('**/nodes.toml').then(files => {
		if (files.length > 0) {
			rootNodeToml = files[0].fsPath;
		}
	});

	if (workDirFolders && workDirFolders.length > 0) {
		client.initialize(workDirFolders[0].uri.fsPath, rootNodeToml).then(_ => {
			vscode.window.showInformationMessage(`[extension] server initialized correctly`);
		});
	}
}