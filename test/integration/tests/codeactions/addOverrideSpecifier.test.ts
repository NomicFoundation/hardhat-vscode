import * as vscode from "vscode";
import { checkOrWaitDiagnostic } from "../../helpers/assertions";
import { getTestContractUri } from "../../helpers/getTestContract";
import {
  applyQuickfix,
  compareWithFile,
  goToPosition,
  openFileInEditor,
  openQuickfixMenu,
} from "../../helpers/editor";

suite("codeactions - add override specifier", function () {
  test("add override on multiple occurrences", async () => {
    const uri = getTestContractUri(
      "main/contracts/codeactions/AddOverrideSpecifier.sol"
    );
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

    goToPosition(diagStart);

    await openQuickfixMenu();
    await applyQuickfix(0);

    compareWithFile(
      editor,
      getTestContractUri(
        "main/contracts/codeactions/AddOverrideSpecifier_fixed.sol"
      )
    );
  });
});
