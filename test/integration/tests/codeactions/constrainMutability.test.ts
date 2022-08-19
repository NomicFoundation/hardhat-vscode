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

suite("codeactions - constrain mutability", function () {
  this.timeout(30000);

  test("add view modifier", async () => {
    const uri = getDocUri(__dirname, "./ConstrainMutabilityView.sol");
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

    goToPosition(editor, diagStart);

    await openQuickfixMenu();
    await applyQuickfix(0);

    compareWithFile(
      editor,
      getDocPath(__dirname, "./ConstrainMutabilityView_fixed.sol")
    );
  });

  test("add pure modifier", async () => {
    const uri = getDocUri(__dirname, "./ConstrainMutabilityPure.sol");
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

    goToPosition(editor, diagStart);

    await openQuickfixMenu();
    await applyQuickfix(0);

    compareWithFile(
      editor,
      getDocPath(__dirname, "./ConstrainMutabilityPure_fixed.sol")
    );
  });

  test("update view to pure", async () => {
    const uri = getDocUri(__dirname, "./ConstrainMutabilityModifyToPure.sol");
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

    goToPosition(editor, diagStart);

    await openQuickfixMenu();
    await applyQuickfix(0);

    compareWithFile(
      editor,
      getDocPath(__dirname, "./ConstrainMutabilityModifyToPure_fixed.sol")
    );
  });
});
