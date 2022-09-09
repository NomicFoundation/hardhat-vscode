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

suite("codeactions - add license identifier", function () {
  test("add MIT license identifier", async () => {
    const uri = getTestContractUri("main/contracts/codeactions/NoLicense.sol");
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

    goToPosition(diagStart);

    await openQuickfixMenu();
    await applyQuickfix(0);

    compareWithFile(
      editor,
      getTestContractUri("main/contracts/codeactions/NoLicense_fixed.sol")
    );
  });
});
