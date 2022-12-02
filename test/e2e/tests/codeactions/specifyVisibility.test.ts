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

suite("codeactions - specify visibility", function () {
  test("specify public", async () => {
    const uri = getTestContractUri(
      "main/contracts/codeactions/SpecifyVisibility.sol"
    );
    const editor = await openFileInEditor(uri);

    const diagStart = new vscode.Position(4, 11);
    const diagEnd = new vscode.Position(4, 14);

    await checkOrWaitDiagnostic(
      uri,
      new vscode.Range(diagStart, diagEnd),
      vscode.DiagnosticSeverity.Error,
      "solidity",
      "No visibility specified"
    );

    goToPosition(diagStart);

    await openQuickfixMenu();
    await applyQuickfix(0);

    compareWithFile(
      editor,
      getTestContractUri(
        "main/contracts/codeactions/SpecifyVisibility_addedPublic.sol"
      )
    );
  });

  test("specify private", async () => {
    const uri = getTestContractUri(
      "main/contracts/codeactions/SpecifyVisibility.sol"
    );
    const editor = await openFileInEditor(uri);

    const diagStart = new vscode.Position(4, 11);
    const diagEnd = new vscode.Position(4, 14);

    await checkOrWaitDiagnostic(
      uri,
      new vscode.Range(diagStart, diagEnd),
      vscode.DiagnosticSeverity.Error,
      "solidity",
      "No visibility specified"
    );

    goToPosition(diagStart);

    await openQuickfixMenu();
    await applyQuickfix(1);

    compareWithFile(
      editor,
      getTestContractUri(
        "main/contracts/codeactions/SpecifyVisibility_addedPrivate.sol"
      )
    );
  });
});
