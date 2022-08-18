import * as vscode from "vscode";
import { checkOrWaitDiagnostic } from "../../helpers/assertions";
import { getDocUri } from "../../helpers/docPaths";
import {
  applyQuickfix,
  compareWithFile,
  goToPosition,
  openFileInEditor,
  openQuickfixMenu,
} from "../../helpers/editor";

suite("codeactions - add license identifier", function () {
  this.timeout(20000);

  test("add MIT license identifier", async () => {
    const uri = getDocUri(__dirname, "./NoLicense.sol");
    const editor = await openFileInEditor(uri);

    const diagStart = new vscode.Position(0, 0);
    const diagEnd = new vscode.Position(0, 0);

    await checkOrWaitDiagnostic(
      uri,
      new vscode.Range(diagStart, diagEnd),
      vscode.DiagnosticSeverity.Warning,
      "solidity",
      "SPDX license identifier not provided"
    );

    goToPosition(editor, diagStart);

    await openQuickfixMenu();
    await applyQuickfix(0);

    compareWithFile(editor, getDocUri(__dirname, "./NoLicense_fixed.sol"));
  });
});
