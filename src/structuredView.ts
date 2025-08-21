import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getNonce } from './utils';

/* Clase donde se van a empaquetar todas las operaciones relacionadas con la vista */
export class StructuredView {
    /* Registro de la vista como servicio (Comando) en la extensión */
    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const disposable = vscode.commands.registerCommand('tpp-extension.structuredView', async () => {			
            try {
                const [fileName, filePath] = await this._getWorkingDir();
                const file = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
                const panel = this._createWebviewPanel(fileName, context);
                //this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
                this._setWebviewMessageListener(panel.webview, file);
            } catch (err) {
                vscode.window.showErrorMessage((err as Error).message);
            }
        });

        return disposable;

    }

    private static async _getWorkingDir(): Promise<[string, string]> {
        /* Seleccion del directorio donde se encuentran los archivos a seleccionar */
        const uri = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            openLabel: 'Select a file'
        });

        if (!uri || uri.length === 0) {
            throw new Error("No elements selected");
        } 

        /* Declaro las constantes de los paths que se van a utilizar */
        const filePath = uri[0].fsPath;
        const fileName = filePath ? filePath.split('/').pop()?.toString() ?? '' : '';

        /* Valido que los paths existan */
        if (!fs.existsSync(filePath)) {
            throw new Error("Required files not found");
        }

        return [fileName, filePath];
    }

    private static _createWebviewPanel(fileName: string, context: vscode.ExtensionContext): vscode.WebviewPanel {
        /* Creo el panel de la webview que se va a utilizar para mostrar la información */
        const panel = vscode.window.createWebviewPanel(
            "FileEditor",
            fileName,
            vscode.ViewColumn.One,
            { 	
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, "out"), vscode.Uri.joinPath(context.extensionUri, "webview-ui/build")],
            }
        );

        /* Armo el html con sus scripts y css para ser utilizados en la webview */
        const cssPath = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, "webview-ui", "build", "assets", "structuredView.css"));
        const jsPath = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, "webview-ui", "build", "assets", "structuredView.js"));
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

    private static _setWebviewMessageListener(webview: vscode.Webview, file: vscode.TextDocument) {
        /* Declaro la función que voy a utilizar para actualizar la información dentro de la webview */
        function updateWebview() {
            vscode.window.showInformationMessage(file.getText());

            webview.postMessage({
                type: 'update',
                contents: file.getText(),
            });
        }
        
        /* Handler que se ocupa de recibir los mensajes enviados por la webview */
        webview.onDidReceiveMessage(e => {
            switch (e.type) {
                case 'edit':
                    this.updateTextDocument(file, e.data);
                    updateWebview();
                    vscode.window.showInformationMessage("edit!");
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