import * as prettier from "prettier";
import * as vscode from "vscode";
import * as path from "path";
import * as prettierPluginSolidity from "prettier-plugin-solidity";

export function formatDocument(
  document: vscode.TextDocument,
  context: vscode.ExtensionContext
): vscode.TextEdit[] {
  const formatter = vscode.workspace
    .getConfiguration("solidity")
    .get<string>("formatter");

  if (formatter !== "prettier") {
    return null;
  }

  const rootPath = getCurrentWorkspaceRootFsPath();

  const ignoreOptions = {
    ignorePath: path.join(rootPath, ".prettierignore"),
  };

  const fileInfo = prettier.getFileInfo.sync(
    document.uri.fsPath,
    ignoreOptions
  );

  if (fileInfo.ignored) {
    return null;
  }

  const source = document.getText();

  const options = {
    useCache: false,
    parser: "solidity-parse",
    pluginSearchDirs: [context.extensionPath],
    plugins: [prettierPluginSolidity],
  };

  const config =
    prettier.resolveConfig.sync(document.uri.fsPath, options) ??
    defaultConfig();

  Object.assign(options, config);

  const firstLine = document.lineAt(0);
  const lastLine = document.lineAt(document.lineCount - 1);

  const fullTextRange = new vscode.Range(
    firstLine.range.start,
    lastLine.range.end
  );

  const formatted = prettier.format(source, options);

  return [vscode.TextEdit.replace(fullTextRange, formatted)];
}

function getCurrentWorkspaceRootFsPath(): string {
  return getCurrentWorkspaceRootFolder().uri.fsPath;
}

function getCurrentWorkspaceRootFolder(): vscode.WorkspaceFolder | undefined {
  const editor = vscode.window.activeTextEditor;
  const currentDocument = editor.document.uri;

  return vscode.workspace.getWorkspaceFolder(currentDocument);
}

function defaultConfig() {
  return {
    printWidth: 80,
    tabWidth: 4,
    useTabs: false,
    singleQuote: false,
    bracketSpacing: false,
    explicitTypes: "preserve",
    overrides: [
      {
        files: "*.sol",
        options: {
          printWidth: 80,
          tabWidth: 4,
          useTabs: false,
          singleQuote: false,
          bracketSpacing: false,
          explicitTypes: "preserve",
        },
      },
    ],
  };
}
