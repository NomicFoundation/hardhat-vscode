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

suite("codeactions - add virtual specifier", function () {
  test("add virtual specifier on multiple occurrences", async () => {
    const uri = getTestContractUri(
      "main/contracts/codeactions/AddVirtualSpecifier.sol"
    );
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

    goToPosition(diagStart);

    await openQuickfixMenu();
    await applyQuickfix(0);

    compareWithFile(
      editor,
      getTestContractUri(
        "main/contracts/codeactions/AddVirtualSpecifier_fixed.sol"
      )
    );
  });
});
