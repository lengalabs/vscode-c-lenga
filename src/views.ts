import * as vscode from 'vscode';
import { getNonce } from './utils';
import { Client } from './client';
import * as nodes from './nodes/cNodes';

export enum View {
	Spike = 'spikeView',
	Structured = 'structuredView',
}

interface CLengaDocumentDelegate {
	getFileData(): Promise<nodes.Node>;
}

interface CLengaEdit {
	readonly color: string;
	readonly stroke: ReadonlyArray<[number, number]>;
}

export abstract class Disposable {
	private _isDisposed = false;

	protected _disposables: vscode.Disposable[] = [];

	public dispose() {
		if (this._isDisposed) {
			return;
		}
		this._isDisposed = true;
		disposeAll(this._disposables);
	}

	protected _register<T extends vscode.Disposable>(value: T): T {
		if (this._isDisposed) {
			value.dispose();
		} else {
			this._disposables.push(value);
		}
		return value;
	}

	protected get isDisposed(): boolean {
		return this._isDisposed;
	}
}

export function disposeAll(disposables: vscode.Disposable[]): void {
	while (disposables.length) {
		const item = disposables.pop();
		if (item) {
			item.dispose();
		}
	}
}

class CLengaDocument extends Disposable implements vscode.CustomDocument {

	static async create(
		uri: vscode.Uri,
		backupId: string | undefined,
		delegate: CLengaDocumentDelegate,
	): Promise<CLengaDocument | PromiseLike<CLengaDocument>> {
		// If we have a backup, read that. Otherwise read the resource from the workspace
		const dataFile = typeof backupId === 'string' ? vscode.Uri.parse(backupId) : uri;
		const fileData = await CLengaDocument.readFile(dataFile);
		return new CLengaDocument(uri, fileData, delegate);
	}

	private static async readFile(uri: vscode.Uri): Promise<Uint8Array> {
		if (uri.scheme === 'untitled') {
			return new Uint8Array();
		}
		return new Uint8Array(await vscode.workspace.fs.readFile(uri));
	}

	private readonly _uri: vscode.Uri;

	private _documentData: Uint8Array;
	private _edits: CLengaEdit[] = [];
	private _savedEdits: CLengaEdit[] = [];

	private readonly _delegate: CLengaDocumentDelegate;

	private constructor(
		uri: vscode.Uri,
		initialContent: Uint8Array,
		delegate: CLengaDocumentDelegate
	) {
		super();
		this._uri = uri;
		this._documentData = initialContent;
		this._delegate = delegate;
	}

	public get uri() { return this._uri; }

	public get documentData(): Uint8Array { return this._documentData; }

	private readonly _onDidDispose = this._register(new vscode.EventEmitter<void>());
	/**
	 * Fired when the document is disposed of.
	 */
	public readonly onDidDispose = this._onDidDispose.event;

	private readonly _onDidChangeDocument = this._register(new vscode.EventEmitter<{
		readonly content?: Uint8Array;
		readonly edits: readonly CLengaEdit[];
	}>());
	/**
	 * Fired to notify webviews that the document has changed.
	 */
	public readonly onDidChangeContent = this._onDidChangeDocument.event;

	private readonly _onDidChange = this._register(new vscode.EventEmitter<{
		readonly label: string,
		undo(): void,
		redo(): void,
	}>());
	/**
	 * Fired to tell VS Code that an edit has occurred in the document.
	 *
	 * This updates the document's dirty indicator.
	 */
	public readonly onDidChange = this._onDidChange.event;

	/**
	 * Called by VS Code when there are no more references to the document.
	 *
	 * This happens when all editors for it have been closed.
	 */
	dispose(): void {
		this._onDidDispose.fire();
		super.dispose();
	}

	/**
	 * Called when the user edits the document in a webview.
	 *
	 * This fires an event to notify VS Code that the document has been edited.
	 */
	makeEdit(edit: CLengaEdit) {
		this._edits.push(edit);

		this._onDidChange.fire({
			label: 'Stroke',
			undo: async () => {
				this._edits.pop();
				this._onDidChangeDocument.fire({
					edits: this._edits,
				});
			},
			redo: async () => {
				this._edits.push(edit);
				this._onDidChangeDocument.fire({
					edits: this._edits,
				});
			}
		});
	}

	/**
	 * Called by VS Code when the user saves the document.
	 */
	async save(cancellation: vscode.CancellationToken): Promise<void> {
		await this.saveAs(this.uri, cancellation);
		this._savedEdits = Array.from(this._edits);
	}

	/**
	 * Called by VS Code when the user saves the document to a new location.
	 */
	async saveAs(targetResource: vscode.Uri, cancellation: vscode.CancellationToken): Promise<void> {
		const fileData = await this._delegate.getFileData();
		if (cancellation.isCancellationRequested) {
			return;
		}
		// await vscode.workspace.fs.writeFile(targetResource, fileData);
	}

	/**
	 * Called by VS Code when the user calls `revert` on a document.
	 */
	async revert(_cancellation: vscode.CancellationToken): Promise<void> {
		const diskContent = await CLengaDocument.readFile(this.uri);
		this._documentData = diskContent;
		this._edits = this._savedEdits;
		this._onDidChangeDocument.fire({
			content: diskContent,
			edits: this._edits,
		});
	}

	/**
	 * Called by VS Code to backup the edited document.
	 *
	 * These backups are used to implement hot exit.
	 */
	async backup(destination: vscode.Uri, cancellation: vscode.CancellationToken): Promise<vscode.CustomDocumentBackup> {
		await this.saveAs(destination, cancellation);

		return {
			id: destination.toString(),
			delete: async () => {
				try {
					await vscode.workspace.fs.delete(destination);
				} catch {
					// noop
				}
			}
		};
	}
}


export class ClengaEditorProvider implements vscode.CustomEditorProvider<CLengaDocument> {
	private static readonly viewType = 'lengalab.c';

	public static register(context: vscode.ExtensionContext, client: Client): vscode.Disposable {
		const provider = new ClengaEditorProvider(context, client);
		const providerRegistration = vscode.window.registerCustomEditorProvider(ClengaEditorProvider.viewType, provider);
		return providerRegistration;
	}

	/**
	 * Tracks all known webviews
	 */
	private readonly webviews = new WebviewCollection();

	constructor(
		private readonly context: vscode.ExtensionContext,
		private lengaClient: Client,
	) { }

	public async resolveCustomEditor(
		document: vscode.CustomDocument,
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
			console.log("updateWebview:\n", JSON.stringify(contents, null, 2));
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
				console.log("openFile\n", JSON.stringify(state, null, 2));
				updateWebview(state);
			})
			.catch(err => {
				vscode.window.showErrorMessage(err);
			});
	}

	async openCustomDocument(
		uri: vscode.Uri,
		openContext: { backupId?: string },
		_token: vscode.CancellationToken
	): Promise<CLengaDocument> {
		const document: CLengaDocument = await CLengaDocument.create(uri, openContext.backupId, {
			getFileData: async () => {
				const webviewsForDocument = Array.from(this.webviews.get(document.uri));
				if (!webviewsForDocument.length) {
					throw new Error('Could not find webview to save for');
				}
				const panel = webviewsForDocument[0];
				const response = await this.postMessageWithResponse<nodes.Node>(panel, 'getFileData', {});
				return response;
			}
		});

		// const listeners: vscode.Disposable[] = [];

		// listeners.push(document.onDidChange(e => {
		// 	// Tell VS Code that the document has been edited by the use.
		// 	this._onDidChangeCustomDocument.fire({
		// 		document,
		// 		...e,
		// 	});
		// }));

		// listeners.push(document.onDidChangeContent(e => {
		// 	// Update all webviews when the document changes
		// 	for (const webviewPanel of this.webviews.get(document.uri)) {
		// 		this.postMessage(webviewPanel, 'update', {
		// 			edits: e.edits,
		// 			content: e.content,
		// 		});
		// 	}
		// }));

		// document.onDidDispose(() => disposeAll(listeners));

		return document;
	}

	private _requestId = 1;
	private readonly _callbacks = new Map<number, (response: any) => void>();

	private postMessageWithResponse<R = unknown>(panel: vscode.WebviewPanel, type: string, body: any): Promise<R> {
		const requestId = this._requestId++;
		const p = new Promise<R>(resolve => this._callbacks.set(requestId, resolve));
		panel.webview.postMessage({ type, requestId, body });
		return p;
	}

	private readonly _onDidChangeCustomDocument = new vscode.EventEmitter<vscode.CustomDocumentEditEvent<CLengaDocument>>();
	public readonly onDidChangeCustomDocument = this._onDidChangeCustomDocument.event;

	public saveCustomDocument(document: CLengaDocument, cancellation: vscode.CancellationToken): Thenable<void> {
		return document.save(cancellation);
	}

	public saveCustomDocumentAs(document: CLengaDocument, destination: vscode.Uri, cancellation: vscode.CancellationToken): Thenable<void> {
		return document.saveAs(destination, cancellation);
	}

	public revertCustomDocument(document: CLengaDocument, cancellation: vscode.CancellationToken): Thenable<void> {
		return document.revert(cancellation);
	}

	public backupCustomDocument(document: CLengaDocument, context: vscode.CustomDocumentBackupContext, cancellation: vscode.CancellationToken): Thenable<vscode.CustomDocumentBackup> {
		return document.backup(context.destination, cancellation);
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