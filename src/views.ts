import * as vscode from 'vscode';
import { getNonce } from './utils';
import { Client } from './client';

export enum View {
    Structured = 'structured',
}

export class SaturnEditorProvider implements vscode.CustomTextEditorProvider {
    private static readonly viewType = 'tpp-extension.saturn';
    private view = View.Structured;

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
		webviewPanel.webview.options = {
			enableScripts: true,
		};
		webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, this.view);

		function updateWebview(content: string) {
			vscode.window.showInformationMessage(`[extension] ${content}`);
			webviewPanel.webview.postMessage({
				type: 'update',
				content: content,
			});
		}

		webviewPanel.webview.onDidReceiveMessage(e => {
			switch (e.type) {
				case 'edit':
					this.saturnClient.edit(document.uri.path, e.data).then(result => {
                        updateWebview(result);
                    });
					return;
			}
		});

        this.saturnClient.openFile(document.uri.fsPath).then(result => {
            updateWebview(result);
        });
	}

	private getHtmlForWebview(webview: vscode.Webview, viewName: string): string {
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'webview-ui', 'build', 'assets', 'spikeView.js'));
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'webview-ui', 'build', 'assets', 'structuredView.css'));
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