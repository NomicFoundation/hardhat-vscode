import * as vscode from "vscode";
import { checkOrWaitDiagnostic } from "../../helpers/assertions";
import { getTestContractUri } from "../../helpers/getTestContract";
import { openFileInEditor } from "../../helpers/editor";

suite("diagnostics", function () {
  test("file with whitespaces", async () => {
    const uri = getTestContractUri(
      "main/contracts/diagnostics/File With Whitespaces.sol"
    );
    await openFileInEditor(uri);

    await checkOrWaitDiagnostic(
      uri,
      new vscode.Range(0, 0, 0, 3),
      vscode.DiagnosticSeverity.Error,
      "solidity",
      "Expected pragma, import directive"
    );
  });
});
