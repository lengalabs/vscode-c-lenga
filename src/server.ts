import * as cp from 'child_process';
import * as vscode from 'vscode';

/**
 * Start the Saturn server
 * @param workingDirectory The working directory where the server will be initialized
 * @returns The a running Saturn server
 */
export function startServer(workingDirectory: string): cp.ChildProcessWithoutNullStreams {
	let serverProcess: cp.ChildProcessWithoutNullStreams;
	var serverPath: string = 'srv/server'; //Configurable

	serverProcess = cp.spawn(serverPath, [], {
		stdio: ['pipe', 'pipe', 'pipe'],
		cwd: workingDirectory,
	});

	serverProcess.stderr.on('data', (data) => {
    	vscode.window.showErrorMessage(`[Server] ${data.toString()}`);
  	});

	return serverProcess;
}