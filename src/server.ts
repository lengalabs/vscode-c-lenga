import * as cp from "child_process";
import * as vscode from "vscode";

/**
 * Start the Lenga server
 * @returns A running Lenga server
 */
export function startServer(): cp.ChildProcessWithoutNullStreams {
  let serverProcess: cp.ChildProcessWithoutNullStreams;
  var serverPath: string = "lenga-server"; //TODO: Make this command configurable ?

  serverProcess = cp.spawn(serverPath);

  serverProcess.stderr.on("data", (data) => {
    vscode.window.showErrorMessage(`[Server] ${data.toString()}`);
  });

  return serverProcess;
}
