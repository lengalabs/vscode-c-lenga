import * as vscode from "vscode";
import * as nodes from './nodes/cNodes';
import { Disposable } from './disposable';

interface CLengaDocumentDelegate {
    getFileData(uri: string): Promise<nodes.Node[]>;
    getEditedData(uri: string, edit: nodes.Node): Promise<[nodes.Node[], nodes.Node]>;
    saveData(uri: string, name: string): Promise<void>;
}

export interface CLengaEdit {
    readonly new_node: nodes.Node;
    old_node: nodes.Node;
}

export class CLengaDocument extends Disposable implements vscode.CustomDocument {
    private readonly _uri: vscode.Uri;

    private _documentData: nodes.Node[];
    private _edits: CLengaEdit[] = [];
    private _savedEdits: CLengaEdit[] = [];

    private readonly _delegate: CLengaDocumentDelegate;

    static async create(
        uri: vscode.Uri,
        backupId: string | undefined,
        delegate: CLengaDocumentDelegate,
    ): Promise<CLengaDocument | PromiseLike<CLengaDocument>> {
        // If we have a backup, read that. Otherwise read the resource from the workspace
        const dataFile = typeof backupId === 'string' ? vscode.Uri.parse(backupId) : uri;
        const fileData = await CLengaDocument.readFile(dataFile, delegate);
        return new CLengaDocument(uri, fileData, delegate);
    }

    private static async readFile(uri: vscode.Uri, delegate: CLengaDocumentDelegate): Promise<nodes.Node[]> {
        if (uri.scheme === 'untitled') {
            return [];
        }
        return await delegate.getFileData(uri.fsPath.toString());
    }

    private constructor(
        uri: vscode.Uri,
        initialContent: nodes.Node[],
        delegate: CLengaDocumentDelegate
    ) {
        super();
        this._uri = uri;
        this._documentData = initialContent;
        this._delegate = delegate;
    }

    public get uri() { return this._uri; }

    public get documentData(): nodes.Node[] { return this._documentData; }

    private readonly _onDidDispose = this._register(new vscode.EventEmitter<void>());
    /**
     * Fired when the document is disposed of.
     */
    public readonly onDidDispose = this._onDidDispose.event;

    private readonly _onDidChangeDocument = this._register(new vscode.EventEmitter<{
        readonly content?: nodes.Node[];
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
        this._delegate.getEditedData(this.uri.fsPath.toString(), edit.new_node)
        .then(response => {
            this._documentData = response[0];
            edit.old_node = response[1];

            this._edits.push(edit);

            this._onDidChange.fire({
                label: 'Modification',
                undo: async () => {
                    this._edits.pop();
                    // revert to old node
                    this._documentData = await this._delegate.getEditedData(this.uri.fsPath.toString(), edit.old_node)
                        .then(res => res[0]);
                    this._onDidChangeDocument.fire({
                        content: this._documentData,
                        edits: this._edits,
                    });
                },
                redo: async () => {
                    // redo new node
                    this._documentData = await this._delegate.getEditedData(this.uri.fsPath.toString(), edit.new_node)
                        .then(res => res[0]);
                    this._edits.push(edit);
                    this._onDidChangeDocument.fire({
                        content: this._documentData,
                        edits: this._edits,
                    });
                }
            });

            this._onDidChangeDocument.fire({
                content: this._documentData,
                edits: this._edits,
            });

        })
        .catch(_ => {
            console.log("Could not edit data"); //TODO: Define error case
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
        if (cancellation.isCancellationRequested) {
            return;
        }
        await this._delegate.saveData(this._uri.fsPath.toString(), targetResource.fsPath.toString());
    }

    /**
     * Called by VS Code when the user calls `revert` on a document.
     */
    async revert(_cancellation: vscode.CancellationToken): Promise<void> {
        const diskContent = await CLengaDocument.readFile(this.uri, this._delegate);
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