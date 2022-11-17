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

suite("codeactions - specify data location", function () {
  test("add, change and remove multiple data locations", async () => {
    const uri = getTestContractUri(
      "main/contracts/codeactions/SpecifyDataLocation.sol"
    );
    const editor = await openFileInEditor(uri);

    // 1st constructor param
    await checkOrWaitDiagnostic(
      uri,
      new vscode.Range(new vscode.Position(5, 14), new vscode.Position(5, 26)),
      vscode.DiagnosticSeverity.Error,
      "solidity",
      'Data location must be "storage" or "memory" for constructor parameter'
    );

    goToPosition(new vscode.Position(5, 14));

    await openQuickfixMenu();
    await applyQuickfix(0);

    // 2nd constructor param

    await checkOrWaitDiagnostic(
      uri,
      new vscode.Range(new vscode.Position(5, 35), new vscode.Position(5, 53)),
      vscode.DiagnosticSeverity.Error,
      "solidity",
      'Data location must be "storage" or "memory" for constructor parameter'
    );

    goToPosition(new vscode.Position(5, 35));

    await openQuickfixMenu();
    await applyQuickfix(0);

    // 1st function param

    await checkOrWaitDiagnostic(
      uri,
      new vscode.Range(new vscode.Position(8, 15), new vscode.Position(8, 35)),
      vscode.DiagnosticSeverity.Error,
      "solidity",
      'Data location must be "memory" or "calldata" for parameter in function'
    );

    goToPosition(new vscode.Position(8, 15));

    await openQuickfixMenu();
    await applyQuickfix(0);

    // 2nd function param

    await checkOrWaitDiagnostic(
      uri,
      new vscode.Range(new vscode.Position(8, 36), new vscode.Position(8, 45)),
      vscode.DiagnosticSeverity.Error,
      "solidity",
      'Data location must be "memory" or "calldata" for parameter in function'
    );

    goToPosition(new vscode.Position(8, 36));

    await openQuickfixMenu();
    await applyQuickfix(0);

    // 1st function return

    await checkOrWaitDiagnostic(
      uri,
      new vscode.Range(
        new vscode.Position(10, 13),
        new vscode.Position(10, 18)
      ),
      vscode.DiagnosticSeverity.Error,
      "solidity",
      'Data location must be "memory" or "calldata" for return parameter'
    );

    goToPosition(new vscode.Position(10, 13));

    await openQuickfixMenu();
    await applyQuickfix(0);

    // 2nd function return

    await checkOrWaitDiagnostic(
      uri,
      new vscode.Range(
        new vscode.Position(10, 27),
        new vscode.Position(10, 41)
      ),
      vscode.DiagnosticSeverity.Error,
      "solidity",
      'Data location must be "memory" or "calldata" for return parameter'
    );

    goToPosition(new vscode.Position(10, 27));

    await openQuickfixMenu();
    await applyQuickfix(0);

    // variable

    await checkOrWaitDiagnostic(
      uri,
      new vscode.Range(new vscode.Position(13, 4), new vscode.Position(13, 29)),
      vscode.DiagnosticSeverity.Error,
      "solidity",
      "Data location can only be specified for array, struct or mapping types"
    );

    goToPosition(new vscode.Position(13, 4));

    await openQuickfixMenu();
    await applyQuickfix(0);

    // Assert with final file

    compareWithFile(
      editor,
      getTestContractUri(
        "main/contracts/codeactions/SpecifyDataLocation_fixed.sol"
      )
    );
  });
});
