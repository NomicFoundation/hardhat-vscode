import * as assert from "assert";
import vscode from "vscode";
import os from "os";
import { openFileInEditor, waitForUI } from "../../helpers/editor";
import { type } from "../../helpers/commands";
import { sleep } from "../../helpers/sleep";
import { getTestContractUri } from "../../helpers/getTestContract";

suite("completion", function () {
  test("[completion] - hardhat node_modules contract import completion on empty", async () => {
    const uri = getTestContractUri("main/contracts/completion/Empty.sol");
    const editor = await openFileInEditor(uri);
    const document = editor.document;

    await type(document, "import '");
    await sleep(2000);
    await vscode.commands.executeCommand("acceptSelectedSuggestion");
    await waitForUI();
    assert.equal(document.getText(), "import '@openzeppelin';");
  });

  test("[completion] - hardhat node_modules contract import completion on partial specification", async () => {
    const uri = getTestContractUri("main/contracts/completion/Empty.sol");
    const editor = await openFileInEditor(uri);
    const document = editor.document;

    await type(document, "import '@openzep");
    await sleep(2000);
    await vscode.commands.executeCommand("acceptSelectedSuggestion");
    await waitForUI();
    assert.equal(document.getText(), "import '@openzeppelin';");
  });

  test("[completion] - hardhat node_modules contract import completion on module specified", async () => {
    const uri = getTestContractUri("main/contracts/completion/Empty.sol");
    const editor = await openFileInEditor(uri);
    const document = editor.document;

    await type(document, "import '@openzeppelin/");
    await sleep(1000);
    await vscode.commands.executeCommand("acceptSelectedSuggestion");
    await waitForUI();
    assert.equal(
      document.getText(),
      "import '@openzeppelin/contracts/access/AccessControl.sol';"
    );
  });

  test("[completion] - hardhat node_modules contract import completion on module and partial contract", async () => {
    const uri = getTestContractUri("main/contracts/completion/Empty.sol");
    const editor = await openFileInEditor(uri);
    const document = editor.document;

    await type(document, "import '@openzeppelin/erc7");
    await sleep(1000);
    await vscode.commands.executeCommand("acceptSelectedSuggestion");
    await waitForUI();
    assert.equal(
      document.getText(),
      "import '@openzeppelin/contracts/token/ERC721/ERC721.sol';"
    );
  });

  test("[completion] - foundry import completions through remappings", async () => {
    // Not running this on windows until we figure out foundry setup on the CI
    if (os.platform() === "win32") {
      return;
    }

    const uri = getTestContractUri("remappings/src/Empty.sol");
    const editor = await openFileInEditor(uri);
    const document = editor.document;

    await type(document, "import '@");
    await sleep(3000);
    await vscode.commands.executeCommand("acceptSelectedSuggestion");
    await waitForUI();
    assert.equal(document.getText(), "import '@lib';");

    await type(document, "/");
    await sleep(1000);
    await vscode.commands.executeCommand("acceptSelectedSuggestion");

    await waitForUI();
    assert.equal(document.getText(), "import '@lib/myLib/Imported.sol';");
  });
});
