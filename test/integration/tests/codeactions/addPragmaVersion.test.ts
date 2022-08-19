import * as vscode from "vscode";
import { checkOrWaitDiagnostic } from "../../helpers/assertions";
import { getDocPath, getDocUri } from "../../helpers/docPaths";
import {
  applyQuickfix,
  compareWithFile,
  goToPosition,
  openFileInEditor,
  openQuickfixMenu,
} from "../../helpers/editor";

suite("codeactions - add solidity pragma", function () {
  this.timeout(30000);

  test("add version of current compiler", async () => {
    const uri = getDocUri(__dirname, "./NoPragma.sol");
    const editor = await openFileInEditor(uri);

    const diagStart = new vscode.Position(0, 0);
    const diagEnd = new vscode.Position(0, 0);

    await checkOrWaitDiagnostic(
      uri,
      new vscode.Range(diagStart, diagEnd),
      vscode.DiagnosticSeverity.Warning,
      "solidity",
      "Source file does not specify required compiler version"
    );

    goToPosition(editor, diagStart);

    await openQuickfixMenu();
    await applyQuickfix(0);

    compareWithFile(editor, getDocPath(__dirname, "./NoPragma_fixed.sol"));
  });
});
