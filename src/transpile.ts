import * as cp from "child_process";
import * as vscode from "vscode";

/**
 * Executes the Lenga transpiler
 */
export function transpileFile(path: vscode.Uri) {
  let transpilerProcess: cp.ChildProcessWithoutNullStreams;
  var transpilerPath: string = "transpiler"; //TODO: Make this command configurable ?

  transpilerProcess = cp.spawn(transpilerPath, [path.fsPath.toString()]);

  transpilerProcess.stderr.on("data", (data) => {
    vscode.window.showErrorMessage(`[Server] ${data.toString()}`);
  });

  transpilerProcess.on("close", (code) => {
    if (code === 0) {
      vscode.window.showInformationMessage(`File transpiled successfully`);
    } else {
      vscode.window.showErrorMessage(`Invalid file`);
    }
  });
}

export async function pickFileFromWorkspace(): Promise<vscode.Uri | undefined> {
  const { workspace, window, Uri } = vscode;

  // No workspace? Offer a file picker as a fallback.
  if (!workspace.workspaceFolders?.length) {
    const picked = await window.showOpenDialog({
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      openLabel: "Select file to transpile",
    });
    return picked?.[0];
  }

  // Build candidate list
  const excludeGlobs = [
    "**/node_modules/**",
    "**/.git/**",
    "**/.venv/**",
    "**/dist/**",
    "**/build/**",
    "**/.next/**",
    "**/.cache/**",
  ].join(",");

  const uris = await vscode.workspace.findFiles("**/*", `{${excludeGlobs}}`, 5000);

  type FileItem = vscode.QuickPickItem & { uri: vscode.Uri };
  const items: FileItem[] = uris.map((uri) => {
    const rel = workspace.asRelativePath(uri, false);
    const basename = rel.split(/[\\/]/).pop() ?? rel;
    const dir = rel.slice(0, Math.max(0, rel.length - basename.length)).replace(/[\\/]$/, "");
    return {
      label: basename,
      description: dir || undefined,
      detail: uri.fsPath,
      uri,
    };
  });

  // Optional browse menu alternative
  const browseItem: FileItem = {
    label: "Browse…",
    description: "Pick from filesystem",
    uri: Uri.file(""),
  };

  const choice = await window.showQuickPick<FileItem>([browseItem, ...items], {
    title: "Transpile file",
    placeHolder: "Type to filter files (fuzzy match on name, folder, or full path)",
    matchOnDescription: true,
    matchOnDetail: true,
  });

  if (!choice) {
    return;
  }

  if (choice === browseItem) {
    const picked = await window.showOpenDialog({
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      openLabel: "Select file to transpile",
    });
    return picked?.[0];
  }

  return choice.uri;
}
