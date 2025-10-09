import * as cp from 'child_process';
import * as vscode from 'vscode';

/**
 * Executes the Lenga transpiler
 */
export function transpileFile(path: vscode.Uri) {
    let transpilerProcess: cp.ChildProcessWithoutNullStreams;
    var transpilerPath: string = 'transpiler'; //TODO: Make this command configurable ?

    transpilerProcess = cp.spawn(transpilerPath, [path.fsPath.toString()]);

    transpilerProcess.stderr.on('data', (data) => {
        vscode.window.showErrorMessage(`[Server] ${data.toString()}`);
    });

    transpilerProcess.on('close', code => {
        if (code === 0) {
            vscode.window.showInformationMessage(`File transpiled successfully`);
        } else {
            vscode.window.showErrorMessage(`Invalid file`);
        }
    });
}