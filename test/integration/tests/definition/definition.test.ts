import vscode from "vscode";
import { getTestContractUri } from "../../helpers/getTestContract";
import {
  getCurrentEditor,
  goToPosition,
  openFileInEditor,
} from "../../helpers/editor";
import {
  assertCurrentTabFile,
  assertPositionEqual,
} from "../../helpers/assertions";

suite("Single-file Navigation", function () {
  const testUri = getTestContractUri("main/contracts/definition/Test.sol");
  const importTestUri = getTestContractUri(
    "main/contracts/definition/ImportTest.sol"
  );

  const circular1Uri = getTestContractUri(
    "main/contracts/definition/Circular1.sol"
  );
  const circular2Uri = getTestContractUri(
    "main/contracts/definition/Circular2.sol"
  );

  test("[Single-file] - Go to Definition", async () => {
    await openFileInEditor(testUri);

    goToPosition(new vscode.Position(14, 25));

    await vscode.commands.executeCommand("editor.action.goToDeclaration");

    await assertCurrentTabFile(testUri.fsPath);
    assertPositionEqual(
      getCurrentEditor().selection.active,
      new vscode.Position(9, 11)
    );
  });

  test("[Single-file][Defined after usage] - Go to Definition", async () => {
    await openFileInEditor(testUri);

    goToPosition(new vscode.Position(15, 9));

    await vscode.commands.executeCommand("editor.action.goToDeclaration");

    await assertCurrentTabFile(testUri.fsPath);
    assertPositionEqual(
      getCurrentEditor().selection.active,
      new vscode.Position(53, 11)
    );
  });

  test("[Single-file][MemberAccess] - Go to Definition", async () => {
    // vscode.extensions.getExtension("nomicfoundation.hardhat-solidity");

    await openFileInEditor(testUri);

    goToPosition(new vscode.Position(26, 25));

    await vscode.commands.executeCommand("editor.action.goToDeclaration");

    await assertCurrentTabFile(testUri.fsPath);
    assertPositionEqual(
      getCurrentEditor().selection.active,
      new vscode.Position(10, 13)
    );
  });

  test("[Single-file][MemberAccess][Defined after usage] - Go to Definition", async () => {
    await openFileInEditor(testUri);

    goToPosition(new vscode.Position(50, 50));

    await vscode.commands.executeCommand("editor.action.goToDeclaration");

    await assertCurrentTabFile(testUri.fsPath);
    assertPositionEqual(
      getCurrentEditor().selection.active,
      new vscode.Position(54, 16)
    );
  });

  test("Jump to import file", async () => {
    await openFileInEditor(importTestUri);

    goToPosition(new vscode.Position(3, 25));

    await vscode.commands.executeCommand("editor.action.goToDeclaration");

    await assertCurrentTabFile(
      getTestContractUri("main/contracts/definition/Foo.sol").fsPath
    );
    assertPositionEqual(
      getCurrentEditor().selection.active,
      new vscode.Position(1, 0)
    );
  });

  test("Jump to import dependency file", async () => {
    await openFileInEditor(importTestUri);

    goToPosition(new vscode.Position(4, 73));

    await vscode.commands.executeCommand("editor.action.goToDeclaration");

    await assertCurrentTabFile(
      getTestContractUri(
        "../node_modules/@openzeppelin/contracts/access/Ownable.sol"
      ).fsPath
    );
    assertPositionEqual(
      getCurrentEditor().selection.active,
      new vscode.Position(3, 0)
    );
  });

  test("Circular dependencies navigation", async () => {
    await openFileInEditor(circular1Uri);

    goToPosition(new vscode.Position(6, 6));

    await vscode.commands.executeCommand("editor.action.goToDeclaration");

    await assertCurrentTabFile(circular2Uri.fsPath);
    assertPositionEqual(
      getCurrentEditor().selection.active,
      new vscode.Position(5, 9)
    );

    goToPosition(new vscode.Position(3, 14));

    await vscode.commands.executeCommand("editor.action.goToDeclaration");

    await assertCurrentTabFile(circular1Uri.fsPath);
    assertPositionEqual(
      getCurrentEditor().selection.active,
      new vscode.Position(1, 0)
    );
  });
});
