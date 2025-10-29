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

  transpilerProcess.on("close", async (code) => {
    if (code === 0) {
      // Determine the output file path and open it
      const outputPath = getTranspiledFilePath(path);
      vscode.window.showInformationMessage(`File transpiled successfully to ${outputPath.fsPath}`);
      try {
        if (outputPath.fsPath.endsWith(".lenga")) {
          // Open .lenga files with the custom editor
          const res = await vscode.commands.executeCommand(
            "vscode.openWith",
            outputPath,
            "c-lenga"
          );
        } else {
          // Open other files (like .c) with the regular text editor
          const document = await vscode.workspace.openTextDocument(outputPath);
          await vscode.window.showTextDocument(document);
        }
      } catch (error) {
        console.warn(`Could not open transpiled file: ${outputPath}`, error);
      }
    } else {
      vscode.window.showErrorMessage(`Invalid file`);
    }
  });
}

/**
 * Determines the output file path for a transpiled file
 */
function getTranspiledFilePath(inputPath: vscode.Uri): vscode.Uri {
  const inputFile = inputPath.fsPath;

  // If it's a .lenga file, remove .lenga extension
  if (inputFile.endsWith(".lenga")) {
    return vscode.Uri.file(inputFile.replace(/\.lenga$/, ""));
  }

  // If it's a .c file, add .lenga extension
  if (inputFile.endsWith(".c")) {
    return vscode.Uri.file(inputFile + ".lenga");
  }

  // Default: add .lenga extension
  return vscode.Uri.file(inputFile + ".lenga");
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
