import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getNonce } from './utils';
//import { getNonce } from './util';

/* Clase donde se van a empaquetar todas las operaciones relacionadas con la vista */
export class GraphView {
	/* Registro de la vista como servicio (Comando) en la extensión */
	public static register(context: vscode.ExtensionContext): vscode.Disposable {
		vscode.window.showInformationMessage("registering graphView command");
		const disposable = vscode.commands.registerCommand('tpp-extension.graphView', async () => {			
			try {
				const [dirName, astPath, metadataPath] = await this._getWorkingDir();
				const astFile = await vscode.workspace.openTextDocument(vscode.Uri.file(astPath));
				const metadataFile = await vscode.workspace.openTextDocument(vscode.Uri.file(metadataPath));
				const panel = this._createWebviewPanel(dirName, context);
				//this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
				this._setWebviewMessageListener(panel.webview, astFile, metadataFile);
			} catch (err) {
				vscode.window.showErrorMessage((err as Error).message);
			}

			vscode.window.showInformationMessage("webview updated");
		});

		return disposable;

	}

	private static async _getWorkingDir(): Promise<[string, string, string]> {
		/* Seleccion del directorio donde se encuentran los archivos a seleccionar */
		const uri = await vscode.window.showOpenDialog({
			canSelectFiles: false,
			canSelectFolders: true,
			canSelectMany: false,
			openLabel: 'Select a folder'
		});

		if (!uri || uri.length === 0) {
			throw new Error("No elements selected");
		} 

		/* Declaro las constantes de los paths que se van a utilizar */
		const dirPath = uri[0].fsPath;
		const dirName = dirPath ? dirPath.split('/').pop()?.toString() ?? '' : '';
		const astFile = path.join(dirPath, 'ast.tpp');
		const metadataFile = path.join(dirPath, 'metadata.tpp');

		/* Valido que los paths existan */
		if (!fs.existsSync(astFile) || !fs.existsSync(metadataFile)) {
			throw new Error("Required files not found");
		}

		vscode.window.showInformationMessage("directory chosen");

		return [dirName, astFile, metadataFile];
	}

	private static _createWebviewPanel(dirName: string, context: vscode.ExtensionContext): vscode.WebviewPanel {
		/* Creo el panel de la webview que se va a utilizar para mostrar la información */
		const panel = vscode.window.createWebviewPanel(
			"FileEditor",
			dirName,
			vscode.ViewColumn.One,
			{ 	
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, "out"), vscode.Uri.joinPath(context.extensionUri, "webview-ui/build")],
			}
		);

		/* Armo el html con sus scripts y css para ser utilizados en la webview */
		const cssPath = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, "webview-ui", "build", "assets", "index.css"));
		const jsPath = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, "webview-ui", "build", "assets", "index.js"));
		const nonce = getNonce();

		panel.webview.html = `
			<!DOCTYPE html>
			<html lang="en">
				<head>
					<meta charset="UTF-8" />
					<meta name="viewport" content="width=device-width, initial-scale=1.0" />
					<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${panel.webview.cspSource}; script-src 'nonce-${nonce}';">
					<link rel="stylesheet" type="text/css" href="${cssPath}">
					<title>Hello World</title>
				</head>
				<body>
					<div id="root"></div>
					<script type="module" nonce="${nonce}" src="${jsPath}"></script>
				</body>
			</html>
			`;

		return panel;
	}

	private static _setWebviewMessageListener(webview: vscode.Webview, ast: vscode.TextDocument, metadata: vscode.TextDocument) {
		/* Declaro la función que voy a utilizar para actualizar la información dentro de la webview */
		function updateWebview() {
			webview.postMessage({
				type: 'update',
				ast: ast.getText(),
				metadata: metadata.getText(),
			});
		}
		
		/* Handler que se ocupa de recibir los mensajes enviados por la webview */
		webview.onDidReceiveMessage(e => {
			switch (e.type) {
				case 'astEdit':
					this.updateTextDocument(ast, e.data);
					updateWebview();
					vscode.window.showInformationMessage("ast edit!");
				case 'metadataEdit':
					this.updateTextDocument(metadata, e.data);
					updateWebview();
					vscode.window.showInformationMessage("metadata edit!");
			}
		});

		updateWebview();
	}

	private static updateTextDocument(document: vscode.TextDocument, json: any) {
		const edit = new vscode.WorkspaceEdit();

		// Just replace the entire document every time for this example extension.
		// A more complete extension should compute minimal edits instead.
		edit.replace(
			document.uri,
			new vscode.Range(0, 0, document.lineCount, 0),
			JSON.stringify(json, null, 2));

		return vscode.workspace.applyEdit(edit);
	}
}