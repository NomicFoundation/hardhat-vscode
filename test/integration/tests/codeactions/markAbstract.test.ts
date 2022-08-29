import * as vscode from "vscode";
import { checkOrWaitDiagnostic } from "../../helpers/assertions";
import { getDocPath, getDocUri } from "../../helpers/docPaths";
import {
  applyQuickfix,
  compareWithFile,
  goToPosition,
  openFileInEditor,
  openQuickfixMenu,
  waitForUI,
} from "../../helpers/editor";

suite("codeactions - mark abstract", function () {
  this.timeout(30000);

  test("add missing functions from interfaces", async () => {
    const uri = getDocUri(__dirname, "./MarkAbstract.sol");
    const editor = await openFileInEditor(uri);

    const diagStart = new vscode.Position(7, 9);
    const diagEnd = new vscode.Position(7, 16);

    await checkOrWaitDiagnostic(
      uri,
      new vscode.Range(diagStart, diagEnd),
      vscode.DiagnosticSeverity.Error,
      "solidity",
      'Contract "Counter" should be marked as abstract'
    );

    goToPosition(editor, diagStart);

    await openQuickfixMenu();
    await applyQuickfix(0);

    compareWithFile(
      editor,
      getDocPath(__dirname, "./MarkAbstract_implementedInterface.sol")
    );
  });

  test("mark contract as abstract", async () => {
    const uri = getDocUri(__dirname, "./MarkAbstract.sol");
    const editor = await openFileInEditor(uri);

    const diagStart = new vscode.Position(7, 9);
    const diagEnd = new vscode.Position(7, 16);

    await checkOrWaitDiagnostic(
      uri,
      new vscode.Range(diagStart, diagEnd),
      vscode.DiagnosticSeverity.Error,
      "solidity",
      'Contract "Counter" should be marked as abstract'
    );
    await waitForUI();

    goToPosition(editor, diagStart);

    await openQuickfixMenu();
    await applyQuickfix(1);

    compareWithFile(
      editor,
      getDocPath(__dirname, "./MarkAbstract_markedAbstract.sol")
    );
  });
});
