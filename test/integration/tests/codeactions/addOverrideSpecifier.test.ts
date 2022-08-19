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

suite("codeactions - add override specifier", function () {
  this.timeout(30000);

  test("add override on multiple occurrences", async () => {
    const uri = getDocUri(__dirname, "./AddOverrideSpecifier.sol");
    const editor = await openFileInEditor(uri);

    const diagStart = new vscode.Position(20, 11);
    const diagEnd = new vscode.Position(20, 25);

    await checkOrWaitDiagnostic(
      uri,
      new vscode.Range(diagStart, diagEnd),
      vscode.DiagnosticSeverity.Error,
      "solidity",
      'Overriding function is missing "override" specifier'
    );

    goToPosition(editor, diagStart);

    await openQuickfixMenu();
    await applyQuickfix(0);

    compareWithFile(
      editor,
      getDocPath(__dirname, "./AddOverrideSpecifier_fixed.sol")
    );
  });
});
