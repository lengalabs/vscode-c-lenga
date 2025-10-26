import * as vscode from "vscode";
import * as cp from "child_process";
import { startServer } from "./server";
import { transpileFile, pickFileFromWorkspace } from "./transpile";
import { Client } from "./client";
import { ClengaEditorProvider } from "./views";

let server: cp.ChildProcessWithoutNullStreams;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  server = startServer();
  var client = new Client();

  initServerWorkspace(client);

  context.subscriptions.push(
    vscode.commands.registerCommand("lengalab.transpileFile", async (filePath?: vscode.Uri) => {
      const target = filePath ?? (await pickFileFromWorkspace());
      if (!target) {
        return;
      }

      await transpileFile(target);
    })
  );

  context.subscriptions.push(ClengaEditorProvider.register(context, client));

  context.subscriptions.push(
    vscode.commands.registerCommand("lengalab.toggleDebug", () => {
      const provider = ClengaEditorProvider.getInstance();
      if (provider) {
        provider.toggleDebugForActiveEditor();
      }
    })
  );
}

export function deactivate() {
  server.kill();
}

function initServerWorkspace(client: Client) {
  var workDirFolders = vscode.workspace.workspaceFolders;
  var rootNodeToml: string = "";
  vscode.workspace.findFiles("**/nodes.toml").then((files) => {
    if (files.length > 0) {
      rootNodeToml = files[0].fsPath;
    }
  });

  if (workDirFolders && workDirFolders.length > 0) {
    client.initialize(workDirFolders[0].uri.fsPath, rootNodeToml).then((_) => {
      vscode.window.showInformationMessage(`[extension] server initialized correctly`);
    });
  }
}
