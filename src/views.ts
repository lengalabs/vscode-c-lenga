import * as vscode from 'vscode';
import { getNonce } from './utils';
import { Client } from './client';

export enum View {
	Spike = 'spikeView',
    Structured = 'structuredView',
}

export class SaturnEditorProvider implements vscode.CustomTextEditorProvider {
    private static readonly viewType = 'tpp-extension.saturn';

	public static register(context: vscode.ExtensionContext, client: Client): vscode.Disposable {
		const provider = new SaturnEditorProvider(context, client);
		const providerRegistration = vscode.window.registerCustomEditorProvider(SaturnEditorProvider.viewType, provider);
		return providerRegistration;
	}

	constructor(
		private readonly context: vscode.ExtensionContext,
        private saturnClient: Client,
	) { }

	public async resolveCustomTextEditor(
		document: vscode.TextDocument,
		webviewPanel: vscode.WebviewPanel,
		_token: vscode.CancellationToken
	): Promise<void> {
		let state: string = "";
		const keyForFile = (uri: vscode.Uri) => `lastView:${uri.toString()}`;
		
		webviewPanel.webview.options = {
			enableScripts: true,
		};
		const lastView = this.context.workspaceState.get<View>(keyForFile(document.uri), View.Spike);
		webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, lastView);

		function updateWebview(contents: string) {
			vscode.window.showInformationMessage(contents);
			webviewPanel.webview.postMessage({
				type: 'update',
				contents: contents,
			});
		}
		
		const d1 = vscode.commands.registerCommand("tpp-extension.setStructuredView", (uri: vscode.Uri) => {
			this.context.workspaceState.update(keyForFile(uri), View.Structured);
			webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, View.Structured);
		});

		const d2 = vscode.commands.registerCommand("tpp-extension.setSpikeView", (uri: vscode.Uri) => {
			this.context.workspaceState.update(keyForFile(uri), View.Spike);
			webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, View.Spike);
		});

		webviewPanel.webview.onDidReceiveMessage(e => {
			switch (e.type) {
				case 'ready':
					updateWebview(state);
					break;
				case 'edit':
					this.saturnClient.edit(document.uri.path, e.data).then(result => {
						state = result;
                        updateWebview(state);
                    });
					return;
			}
		});

		webviewPanel.onDidDispose(() => {
			d1.dispose();
			d2.dispose();
		});

        this.saturnClient.openFile(document.uri.fsPath).then(result => {
			state = result;
			updateWebview(state);
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
                    <title>Saturn Editor</title>
                </head>
                <body>
                    <div id="root"></div>
                    <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
                </body>
			</html>`;
	}
}