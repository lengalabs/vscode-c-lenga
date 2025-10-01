import * as vscode from 'vscode';
import { getNonce } from './utils';
import { Client } from './client';
import * as nodes from './nodes/cNodes';

export enum View {
	Spike = 'spikeView',
	Structured = 'structuredView',
}

export class ClengaEditorProvider implements vscode.CustomTextEditorProvider {
	private static readonly viewType = 'lengalab.c';

	public static register(context: vscode.ExtensionContext, client: Client): vscode.Disposable {
		const provider = new ClengaEditorProvider(context, client);
		const providerRegistration = vscode.window.registerCustomEditorProvider(ClengaEditorProvider.viewType, provider);
		return providerRegistration;
	}

	constructor(
		private readonly context: vscode.ExtensionContext,
		private lengaClient: Client,
	) { }

	public async resolveCustomTextEditor(
		document: vscode.TextDocument,
		webviewPanel: vscode.WebviewPanel,
		_token: vscode.CancellationToken
	): Promise<void> {
		let state: nodes.Node[];
		const keyForFile = (uri: vscode.Uri) => `lastView:${uri.toString()}`;

		webviewPanel.webview.options = {
			enableScripts: true,
		};
		const lastView = this.context.workspaceState.get<View>(keyForFile(document.uri), View.Structured);
		webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, lastView);

		function updateWebview(contents: nodes.Node[]) {
			console.log(JSON.stringify(contents, null, 2));
			webviewPanel.webview.postMessage({
				type: 'update',
				contents: contents,
			});
		}

		const d1 = vscode.commands.registerCommand("clenga.setStructuredView", (uri: vscode.Uri) => {
			this.context.workspaceState.update(keyForFile(uri), View.Structured);
			webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, View.Structured);
		});

		const d2 = vscode.commands.registerCommand("clenga.setSpikeView", (uri: vscode.Uri) => {
			this.context.workspaceState.update(keyForFile(uri), View.Spike);
			webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, View.Spike);
		});

		webviewPanel.webview.onDidReceiveMessage(e => {
			switch (e.type) {
				case 'ready':
					updateWebview(state);
					break;
				case 'edit':
					this.lengaClient.edit(document.uri.path, e.data)
						.then(result => {
							state = result;
							updateWebview(state);
						})
						.catch(err => {
							vscode.window.showErrorMessage(err);
						});
					return;
				case 'nodeEdit':
					vscode.window.showInformationMessage("edit!!");
					updateWebview([e.contents]);
					return;
			}
		});

		webviewPanel.onDidDispose(() => {
			d1.dispose();
			d2.dispose();
		});

		this.lengaClient.openFile(document.uri.fsPath)
			.then(result => {
				state = result;
				console.log(JSON.stringify(state, null, 2));
				updateWebview(state);
			})
			.catch(err => {
				vscode.window.showErrorMessage(err);
			});

	}

	private getHtmlForWebview(webview: vscode.Webview, viewName: string): string {
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'webview-ui', 'build', 'assets', viewName + '.js'));
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'webview-ui', 'build', 'assets', viewName + '.css'));
		const nonce = getNonce();

		return `
			<!DOCTYPE html>
			<html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource}; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <link href="${styleMainUri}" rel="stylesheet" />
                    <title>CLenga Editor</title>
                </head>
                <body>
                    <div id="root"></div>
                    <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
                </body>
			</html>`;
	}
}