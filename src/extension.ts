import * as vscode from 'vscode';
import { GraphView } from './graphView';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('Starting tpp-extension...');

	context.subscriptions.push(GraphView.register(context));
}

export function deactivate() {}
