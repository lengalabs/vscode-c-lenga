import * as vscode from "vscode";
import { getNonce } from "./utils";
import { Client } from "./client";
import * as nodes from "./nodes/cNodes";
import { CLengaDocument, CLengaEdit } from "./cDocument";
import { disposeAll } from "./disposable";

export enum View {
  Structured = "structuredView",
}

export class ClengaEditorProvider
  implements vscode.CustomEditorProvider<CLengaDocument>
{
  private static readonly viewType = "lengalab.c";
  private readonly webviews = new WebviewCollection();

  public static register(
    context: vscode.ExtensionContext,
    client: Client
  ): vscode.Disposable {
    const provider = new ClengaEditorProvider(context, client);
    const providerRegistration = vscode.window.registerCustomEditorProvider(
      ClengaEditorProvider.viewType,
      provider,
      { supportsMultipleEditorsPerDocument: true }
    );
    return providerRegistration;
  }

  constructor(
    private readonly context: vscode.ExtensionContext,
    private lengaClient: Client
  ) {}

  async openCustomDocument(
    uri: vscode.Uri,
    openContext: { backupId?: string },
    _token: vscode.CancellationToken
  ): Promise<CLengaDocument> {
    const document: CLengaDocument = await CLengaDocument.create(
      uri,
      openContext.backupId,
      {
        getFileData: this.lengaClient.openFile.bind(this.lengaClient),
        getEditedData: this.lengaClient.edit.bind(this.lengaClient),
        saveData: this.lengaClient.save.bind(this.lengaClient),
      }
    );

    const listeners: vscode.Disposable[] = [];

    listeners.push(
      document.onDidChange((e) => {
        // Tell VS Code that the document has been edited by the use.
        this._onDidChangeCustomDocument.fire({
          document,
          ...e,
        });
      })
    );

    listeners.push(
      document.onDidChangeContent((e) => {
        // Update all webviews when the document changes
        for (const webviewPanel of this.webviews.get(document.uri)) {
          this.postMessage(webviewPanel, "update", e.content);
        }
      })
    );

    document.onDidDispose(() => disposeAll(listeners));

    return document;
  }

  public async resolveCustomEditor(
    document: CLengaDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    this.webviews.add(document.uri, webviewPanel);
    const keyForFile = (uri: vscode.Uri) => `lastView:${uri.toString()}`;

    webviewPanel.webview.options = {
      enableScripts: true,
    };
    const lastView = this.context.workspaceState.get<View>(
      keyForFile(document.uri),
      View.Structured
    );
    webviewPanel.webview.html = this.getHtmlForWebview(
      webviewPanel.webview,
      lastView
    );

    webviewPanel.webview.onDidReceiveMessage((e) => {
      console.log("received:\n", JSON.stringify(e, null, 2));
      switch (e.type) {
        case "ready":
          this.postMessage(webviewPanel, "update", document.documentData);
          break;
        case "nodeEdit":
          const old_node: nodes.UnknownNode = {
            id: "",
            type: "UnknownNode",
            contents: "",
          };
          const edit: CLengaEdit = { new_node: e.contents, old_node };
          document.makeEdit(edit);
      }
    });

    // TODO: Move to other place, or limit one webview per document
    // const d1 = vscode.commands.registerCommand("clenga.setStructuredView", (uri: vscode.Uri) => {
    // 	this.context.workspaceState.update(keyForFile(uri), View.Structured);
    // 	webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, View.Structured);
    // });

    // webviewPanel.onDidDispose(() => {
    // 	d1.dispose();
    // });
  }

  private postMessage(
    panel: vscode.WebviewPanel,
    type: string,
    contents: any
  ): void {
    console.log("sending:\n", JSON.stringify(contents, null, 2));
    panel.webview.postMessage({ type, contents });
  }

  private readonly _onDidChangeCustomDocument = new vscode.EventEmitter<
    vscode.CustomDocumentEditEvent<CLengaDocument>
  >();
  public readonly onDidChangeCustomDocument =
    this._onDidChangeCustomDocument.event;

  public saveCustomDocument(
    document: CLengaDocument,
    cancellation: vscode.CancellationToken
  ): Thenable<void> {
    return document.save(cancellation);
  }

  public saveCustomDocumentAs(
    document: CLengaDocument,
    destination: vscode.Uri,
    cancellation: vscode.CancellationToken
  ): Thenable<void> {
    return document.saveAs(destination, cancellation);
  }

  public revertCustomDocument(
    document: CLengaDocument,
    cancellation: vscode.CancellationToken
  ): Thenable<void> {
    return document.revert(cancellation);
  }

  public backupCustomDocument(
    document: CLengaDocument,
    context: vscode.CustomDocumentBackupContext,
    cancellation: vscode.CancellationToken
  ): Thenable<vscode.CustomDocumentBackup> {
    return document.backup(context.destination, cancellation);
  }

  private getHtmlForWebview(webview: vscode.Webview, viewName: string): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "webview-ui",
        "build",
        "assets",
        viewName + ".js"
      )
    );
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "webview-ui",
        "build",
        "assets",
        viewName + ".css"
      )
    );
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

class WebviewCollection {
  private readonly _webviews = new Set<{
    readonly resource: string;
    readonly webviewPanel: vscode.WebviewPanel;
  }>();

  /**
   * Get all known webviews for a given uri.
   */
  public *get(uri: vscode.Uri): Iterable<vscode.WebviewPanel> {
    const key = uri.toString();
    for (const entry of this._webviews) {
      if (entry.resource === key) {
        yield entry.webviewPanel;
      }
    }
  }

  /**
   * Add a new webview to the collection.
   */
  public add(uri: vscode.Uri, webviewPanel: vscode.WebviewPanel) {
    const entry = { resource: uri.toString(), webviewPanel };
    this._webviews.add(entry);

    webviewPanel.onDidDispose(() => {
      this._webviews.delete(entry);
    });
  }
}
