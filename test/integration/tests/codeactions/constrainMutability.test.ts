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

suite("codeactions - constrain mutability", function () {
  test("add view modifier", async () => {
    const uri = getTestContractUri(
      "main/contracts/codeactions/ConstrainMutabilityView.sol"
    );
    const editor = await openFileInEditor(uri);

    const diagStart = new vscode.Position(6, 11);
    const diagEnd = new vscode.Position(6, 21);

    await checkOrWaitDiagnostic(
      uri,
      new vscode.Range(diagStart, diagEnd),
      vscode.DiagnosticSeverity.Warning,
      "solidity",
      "Function state mutability"
    );

    goToPosition(diagStart);

    await openQuickfixMenu();
    await applyQuickfix(0);

    compareWithFile(
      editor,
      getTestContractUri(
        "main/contracts/codeactions/ConstrainMutabilityView_fixed.sol"
      )
    );
  });

  test("add pure modifier", async () => {
    const uri = getTestContractUri(
      "main/contracts/codeactions/ConstrainMutabilityPure.sol"
    );
    const editor = await openFileInEditor(uri);

    const diagStart = new vscode.Position(4, 11);
    const diagEnd = new vscode.Position(4, 18);

    await checkOrWaitDiagnostic(
      uri,
      new vscode.Range(diagStart, diagEnd),
      vscode.DiagnosticSeverity.Warning,
      "solidity",
      "Function state mutability"
    );

    goToPosition(diagStart);

    await openQuickfixMenu();
    await applyQuickfix(0);

    compareWithFile(
      editor,
      getTestContractUri(
        "main/contracts/codeactions/ConstrainMutabilityPure_fixed.sol"
      )
    );
  });

  test("update view to pure", async () => {
    const uri = getTestContractUri(
      "main/contracts/codeactions/ConstrainMutabilityModifyToPure.sol"
    );
    const editor = await openFileInEditor(uri);

    const diagStart = new vscode.Position(4, 11);
    const diagEnd = new vscode.Position(4, 21);

    await checkOrWaitDiagnostic(
      uri,
      new vscode.Range(diagStart, diagEnd),
      vscode.DiagnosticSeverity.Warning,
      "solidity",
      "Function state mutability"
    );

    goToPosition(diagStart);

    await openQuickfixMenu();
    await applyQuickfix(0);

    compareWithFile(
      editor,
      getTestContractUri(
        "main/contracts/codeactions/ConstrainMutabilityModifyToPure_fixed.sol"
      )
    );
  });
});
