import * as vscode from "vscode";
import { checkOrWaitDiagnostic } from "../../helpers/assertions";
import { getTestContractUri } from "../../helpers/getTestContract";
import { openFileInEditor } from "../../helpers/editor";

suite("diagnostics - hardhat", function () {
  test("non existing import", async () => {
    const uri = getTestContractUri(
      "main/contracts/diagnostics/InvalidImport.sol"
    );
    await openFileInEditor(uri);

    await checkOrWaitDiagnostic(
      uri,
      new vscode.Range(4, 8, 4, 25),
      vscode.DiagnosticSeverity.Error,
      "hardhat",
      "Imported file not found"
    );
  });
});
