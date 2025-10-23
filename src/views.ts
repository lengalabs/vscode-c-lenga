import * as vscode from "vscode";
import { getNonce } from "./utils";
import { Client } from "./client";
import * as nodes from "./language_objects/cNodes";
import { CLengaDocument, CLengaEdit } from "./cDocument";
import { disposeAll } from "./disposable";

export enum View {
  Structured = "structuredView",
  Graph = "graphView",
}

const keyForFile = (uri: vscode.Uri) => `lastView:${uri.toString()}`;

export class ClengaEditorProvider implements vscode.CustomEditorProvider<CLengaDocument> {
  private static readonly viewType = "lengalab.c";
  private readonly webviews = new WebviewCollection();
  private static instance: ClengaEditorProvider | null = null;
  private activeWebviewPanel: vscode.WebviewPanel | null = null;

  public static register(context: vscode.ExtensionContext, client: Client): vscode.Disposable {
    const provider = new ClengaEditorProvider(context, client);
    ClengaEditorProvider.instance = provider;
    const providerRegistration = vscode.window.registerCustomEditorProvider(
      ClengaEditorProvider.viewType,
      provider,
      { supportsMultipleEditorsPerDocument: true }
    );
    return providerRegistration;
  }

  public static getInstance(): ClengaEditorProvider | null {
    return ClengaEditorProvider.instance;
  }

  constructor(
    private readonly context: vscode.ExtensionContext,
    private lengaClient: Client
  ) {}

  public toggleDebugForActiveEditor() {
    console.log("toggleDebugForActiveEditor called, activeWebviewPanel:", this.activeWebviewPanel);
    if (this.activeWebviewPanel) {
      this.postMessage(this.activeWebviewPanel, "toggleDebug", {});
    } else {
      console.log("No active webview panel found");
    }
  }

  async openCustomDocument(
    uri: vscode.Uri,
    openContext: { backupId?: string },
    _token: vscode.CancellationToken
  ): Promise<CLengaDocument> {
    const document: CLengaDocument = await CLengaDocument.create(uri, openContext.backupId, {
      getFileData: this.lengaClient.openFile.bind(this.lengaClient),
      getEditedData: this.lengaClient.edit.bind(this.lengaClient),
      saveData: this.lengaClient.save.bind(this.lengaClient),
      closeFile: this.lengaClient.closeFile.bind(this.lengaClient),
    });

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

    listeners.push(
      vscode.commands.registerCommand("lengalab.setStructuredView", (uri: vscode.Uri) => {
        this.context.workspaceState.update(keyForFile(uri), View.Structured);
        if (this.activeWebviewPanel) {
          this.activeWebviewPanel.webview.html = this.getHtmlForWebview(
            this.activeWebviewPanel.webview,
            View.Structured
          );
        }
      })
    );

    listeners.push(
      vscode.commands.registerCommand("lengalab.setGraphView", (uri: vscode.Uri) => {
        this.context.workspaceState.update(keyForFile(uri), View.Graph);
        if (this.activeWebviewPanel) {
          this.activeWebviewPanel.webview.html = this.getHtmlForWebview(
            this.activeWebviewPanel.webview,
            View.Graph
          );
        }
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

    // Track when this webview becomes active
    webviewPanel.onDidChangeViewState((e) => {
      if (e.webviewPanel.active) {
        this.activeWebviewPanel = e.webviewPanel;
      }
    });

    // Set as active immediately if visible
    if (webviewPanel.active) {
      this.activeWebviewPanel = webviewPanel;
    }

    webviewPanel.webview.options = {
      enableScripts: true,
    };
    const lastView = this.context.workspaceState.get<View>(
      keyForFile(document.uri),
      View.Structured
    );
    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, View.Structured);

    webviewPanel.webview.onDidReceiveMessage((e) => {
      console.log("received:\n", JSON.stringify(e, null, 2));
      switch (e.type) {
        case "ready":
          this.postMessage(webviewPanel, "update", document.documentData);
          break;
        case "nodeEdit":
          const old_node: nodes.Unknown = {
            id: "",
            type: "unknown",
            content: "",
          };
          const edit: CLengaEdit = { new_node: e.contents, old_node };
          document.makeEdit(edit);
          break;
        case "requestAvailableInserts":
          this.lengaClient
            .availableInserts(document.id, e.nodeId, e.nodeKey)
            .then((options) => {
              this.postMessage(webviewPanel, "availableInserts", options);
            })
            .catch((err) => {
              console.error("Error getting available inserts:", err);
            });
          break;
      }
    });
  }
  private postMessage(panel: vscode.WebviewPanel, type: string, contents: any): void {
    console.log("sending:\n", JSON.stringify(contents, null, 2));
    const res = panel.webview.postMessage({ type, contents });
  }

  private readonly _onDidChangeCustomDocument = new vscode.EventEmitter<
    vscode.CustomDocumentEditEvent<CLengaDocument>
  >();
  public readonly onDidChangeCustomDocument = this._onDidChangeCustomDocument.event;

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
        viewName,
        viewName + ".js"
      )
    );
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "webview-ui",
        "build",
        viewName,
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
