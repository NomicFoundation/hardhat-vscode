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

suite("codeactions - add solidity pragma", function () {
  test("add version of current compiler", async () => {
    const uri = getTestContractUri("main/contracts/codeactions/NoPragma.sol");
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

    goToPosition(diagStart);

    await openQuickfixMenu();
    await applyQuickfix(0);

    compareWithFile(
      editor,
      getTestContractUri("main/contracts/codeactions/NoPragma_fixed.sol")
    );
  });
});
