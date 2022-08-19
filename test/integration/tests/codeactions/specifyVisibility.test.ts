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

suite("codeactions - specify visibility", function () {
  this.timeout(30000);

  test("specify public", async () => {
    const uri = getDocUri(__dirname, "./SpecifyVisibility.sol");
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

    goToPosition(editor, diagStart);

    await openQuickfixMenu();
    await applyQuickfix(0);

    compareWithFile(
      editor,
      getDocPath(__dirname, "./SpecifyVisibility_addedPublic.sol")
    );
  });

  test("specify private", async () => {
    const uri = getDocUri(__dirname, "./SpecifyVisibility.sol");
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

    goToPosition(editor, diagStart);

    await openQuickfixMenu();
    await applyQuickfix(1);

    compareWithFile(
      editor,
      getDocPath(__dirname, "./SpecifyVisibility_addedPrivate.sol")
    );
  });
});
