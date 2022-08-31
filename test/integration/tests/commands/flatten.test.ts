/* eslint-disable @typescript-eslint/no-non-null-assertion */
import assert from "assert";
import * as vscode from "vscode";
import { getDocUri } from "../../helpers/docPaths";
import { openFileInEditor, waitForUI } from "../../helpers/editor";

suite("commands - flatten", function () {
  this.timeout(30000);

  test("flatten via command palette", async () => {
    const uri = getDocUri(__dirname, "./Importer.sol");
    await openFileInEditor(uri);

    await vscode.commands.executeCommand(
      "workbench.action.quickOpen",
      ">Hardhat: Flatten"
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
    assert.ok(
      editor.document.getText().includes("Sources flattened with hardhat")
    );
  });
});
