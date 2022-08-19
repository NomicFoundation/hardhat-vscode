import * as vscode from "vscode";
import { checkOrWaitDiagnostic } from "../../helpers/assertions";
import { getDocUri } from "../../helpers/docPaths";
import { openFileInEditor } from "../../helpers/editor";

suite("diagnostics", function () {
  this.timeout(30000);

  test("[diagnostics] missing semicolon", async () => {
    const uri = getDocUri(__dirname, "./MissingSemicolon.sol");
    await openFileInEditor(uri);

    await checkOrWaitDiagnostic(
      uri,
      new vscode.Range(5, 0, 5, 1),
      vscode.DiagnosticSeverity.Error,
      "solidity",
      "Expected ';' but got '}'"
    );
  });

  test("[diagnostics] invalid assignment", async () => {
    const uri = getDocUri(__dirname, "./InvalidAssignment.sol");
    await openFileInEditor(uri);

    await checkOrWaitDiagnostic(
      uri,
      new vscode.Range(7, 11, 7, 16),
      vscode.DiagnosticSeverity.Error,
      "solidity",
      "Type bool is not implicitly convertible to expected type uint256"
    );
  });

  test("[diagnostics] mark abstract", async () => {
    const uri = getDocUri(__dirname, "./MarkAbstract.sol");
    await openFileInEditor(uri);

    await checkOrWaitDiagnostic(
      uri,
      new vscode.Range(7, 9, 7, 16),
      vscode.DiagnosticSeverity.Error,
      "solidity",
      'Contract "Counter" should be marked as abstract'
    );
  });
});
