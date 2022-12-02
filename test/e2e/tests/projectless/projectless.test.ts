import * as vscode from "vscode";
import { getTestContractUri } from "../../helpers/getTestContract";
import {
  getCurrentEditor,
  goToPosition,
  openFileInEditor,
} from "../../helpers/editor";
import {
  assertCurrentTabFile,
  assertPositionEqual,
  checkOrWaitDiagnostic,
} from "../../helpers/assertions";

suite("projectless", function () {
  test("[navigation] jump to definition", async () => {
    const importerUri = getTestContractUri("projectless/src/Foo.sol");
    const importedUri = getTestContractUri("projectless/lib/Quz.sol");

    // Go to Quz.sol from usage line
    const importerEditor = await openFileInEditor(importerUri);

    goToPosition(new vscode.Position(6, 16));

    await vscode.commands.executeCommand("editor.action.goToDeclaration");

    await assertCurrentTabFile(importedUri.fsPath);
    assertPositionEqual(
      getCurrentEditor().selection.active,
      new vscode.Position(2, 0)
    );

    // Go to Quz.sol from usage line
    await vscode.window.showTextDocument(importerEditor.document);

    goToPosition(new vscode.Position(11, 17));

    await vscode.commands.executeCommand("editor.action.goToDeclaration");

    await assertCurrentTabFile(importedUri.fsPath);

    assertPositionEqual(
      getCurrentEditor().selection.active,
      new vscode.Position(4, 9)
    );
  });

  test("[validation] compiler warning", async () => {
    const uri = getTestContractUri("projectless/src/Foo.sol");

    await openFileInEditor(uri);

    await checkOrWaitDiagnostic(
      uri,
      new vscode.Range(15, 11, 15, 14),
      vscode.DiagnosticSeverity.Warning,
      "solidity",
      "Function state mutability can be restricted to view"
    );
  });

  test("[validation] compiler error", async () => {
    const uri = getTestContractUri("projectless/src/CompilerError.sol");

    await openFileInEditor(uri);

    await checkOrWaitDiagnostic(
      uri,
      new vscode.Range(5, 16, 5, 21),
      vscode.DiagnosticSeverity.Error,
      "solidity",
      "not implicitly convertible to expected type uint256"
    );
  });

  test("[validation] non existent import", async () => {
    const uri = getTestContractUri("projectless/src/ImportNonexistent.sol");

    await openFileInEditor(uri);

    await checkOrWaitDiagnostic(
      uri,
      new vscode.Range(4, 0, 4, 27),
      vscode.DiagnosticSeverity.Error,
      "solidity",
      "File not found"
    );
  });
});
