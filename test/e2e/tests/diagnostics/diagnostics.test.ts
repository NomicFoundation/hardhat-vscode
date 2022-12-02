import * as vscode from "vscode";
import { checkOrWaitDiagnostic } from "../../helpers/assertions";
import { getTestContractUri } from "../../helpers/getTestContract";
import { openFileInEditor } from "../../helpers/editor";

suite("diagnostics", function () {
  test("[diagnostics] missing semicolon", async () => {
    const uri = getTestContractUri(
      "main/contracts/diagnostics/MissingSemicolon.sol"
    );
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
    const uri = getTestContractUri(
      "main/contracts/diagnostics/InvalidAssignment.sol"
    );
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
    const uri = getTestContractUri(
      "main/contracts/diagnostics/MarkAbstract.sol"
    );
    await openFileInEditor(uri);

    await checkOrWaitDiagnostic(
      uri,
      new vscode.Range(7, 9, 7, 16),
      vscode.DiagnosticSeverity.Error,
      "solidity",
      'Contract "Counter" should be marked as abstract'
    );
  });

  test("[diagnostics] multiple character encodings", async () => {
    for (const fileName of ["UTF8Characters.sol", "UTF16Characters.sol"]) {
      const uri = getTestContractUri(`main/contracts/diagnostics/${fileName}`);
      await openFileInEditor(uri);

      await checkOrWaitDiagnostic(
        uri,
        new vscode.Range(7, 4, 7, 14),
        vscode.DiagnosticSeverity.Error,
        "solidity",
        "Different number of arguments in return statement"
      );
    }
  });
});
