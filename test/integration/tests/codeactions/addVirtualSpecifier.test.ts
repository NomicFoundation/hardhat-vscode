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

suite("codeactions - add virtual specifier", function () {
  this.timeout(30000);

  test("add virtual specifier on multiple occurrences", async () => {
    const uri = getDocUri(__dirname, "./AddVirtualSpecifier.sol");
    const editor = await openFileInEditor(uri);

    const diagStart = new vscode.Position(4, 11);
    const diagEnd = new vscode.Position(4, 15);
    await checkOrWaitDiagnostic(
      uri,
      new vscode.Range(diagStart, diagEnd),
      vscode.DiagnosticSeverity.Error,
      "solidity",
      "Trying to override non-virtual function"
    );

    goToPosition(editor, diagStart);

    await openQuickfixMenu();
    await applyQuickfix(0);

    compareWithFile(
      editor,
      getDocPath(__dirname, "AddVirtualSpecifier_fixed.sol")
    );
  });
});
