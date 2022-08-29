/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as vscode from "vscode";
import { getDocPath, getDocUri } from "../../helpers/docPaths";
import {
  compareWithFile,
  openFileInEditor,
  waitForUI,
} from "../../helpers/editor";

suite("commands - flatten", function () {
  this.timeout(20000);

  test("flatten via command palette", async () => {
    const uri = getDocUri(__dirname, "./Importer.sol");
    await openFileInEditor(uri);

    await vscode.commands.executeCommand(
      "workbench.action.quickOpen",
      ">Solidity + Hardhat: Flatten"
    );
    await waitForUI();

    await vscode.commands.executeCommand(
      "workbench.action.acceptSelectedQuickOpenItem"
    );

    // Wait for new tab to be opened, then a bit extra for the contract text to be populated
    await new Promise((resolve) =>
      vscode.workspace.onDidOpenTextDocument(resolve)
    );
    await waitForUI();

    const editor = vscode.window.activeTextEditor!;
    compareWithFile(editor, getDocPath(__dirname, "./Flattened.sol"));
  });
});
