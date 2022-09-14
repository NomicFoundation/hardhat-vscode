import * as vscode from "vscode";
import assert from "assert";
import { getTestContractUri } from "../../helpers/getTestContract";
import {
  getCurrentEditor,
  goToPosition,
  openFileInEditor,
} from "../../helpers/editor";
import { assertPositionEqual } from "../../helpers/assertions";

suite("remappings", function () {
  for (const project of ["hybrid", "pure_foundry"]) {
    test(`[remappings] multiple navigations in ${project} project`, async () => {
      const importerUri = getTestContractUri(`${project}/src/Importer.sol`);
      const importedUri = getTestContractUri(
        `${project}/lib/myLib/Imported.sol`
      );
      const otherImportedUri = getTestContractUri(
        `${project}/lib/myLib/OtherImported.sol`
      );

      const importerEditor = await openFileInEditor(importerUri);

      // Go to Imported.sol from import line
      goToPosition(new vscode.Position(4, 23));

      await vscode.commands.executeCommand("editor.action.goToDeclaration");

      assert.equal(getCurrentEditor().document.fileName, importedUri.fsPath);
      assertPositionEqual(
        getCurrentEditor().selection.active,
        new vscode.Position(2, 0)
      );

      // Go to OtherImported.sol from import line
      await vscode.window.showTextDocument(importerEditor.document);

      goToPosition(new vscode.Position(5, 23));

      await vscode.commands.executeCommand("editor.action.goToDeclaration");

      assert.equal(
        getCurrentEditor().document.fileName,
        otherImportedUri.fsPath
      );
      assertPositionEqual(
        getCurrentEditor().selection.active,
        new vscode.Position(2, 0)
      );

      // Go to Imported.sol from usage line
      await vscode.window.showTextDocument(importerEditor.document);

      goToPosition(new vscode.Position(8, 5));

      await vscode.commands.executeCommand("editor.action.goToDeclaration");

      assert.equal(getCurrentEditor().document.fileName, importedUri.fsPath);
      assertPositionEqual(
        getCurrentEditor().selection.active,
        new vscode.Position(4, 9)
      );

      // Go to OtherImported.sol from usage line
      await vscode.window.showTextDocument(importerEditor.document);

      goToPosition(new vscode.Position(9, 5));

      await vscode.commands.executeCommand("editor.action.goToDeclaration");

      assert.equal(
        getCurrentEditor().document.fileName,
        otherImportedUri.fsPath
      );
      assertPositionEqual(
        getCurrentEditor().selection.active,
        new vscode.Position(4, 9)
      );
    });
  }
});
