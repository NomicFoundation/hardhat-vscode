import * as assert from "assert";
import vscode from "vscode";
import { openFileInEditor, waitForUI } from "../../helpers/editor";
import { type } from "../../helpers/commands";
import { sleep } from "../../helpers/sleep";
import { getTestContractUri } from "../../helpers/getTestContract";

suite("completion", function () {
  test("[completion] - add semicolon automatically after import", async () => {
    const uri = getTestContractUri(
      "main/contracts/completion/AddSemicolon.sol"
    );
    const editor = await openFileInEditor(uri);
    const document = editor.document;

    await type(document, "import '");
    await sleep(2000);
    await vscode.commands.executeCommand("acceptSelectedSuggestion");
    await waitForUI();
    assert.equal(document.getText(), "import '@openzeppelin';");

    await type(document, "/");
    await sleep(1000);
    await vscode.commands.executeCommand("acceptSelectedSuggestion");

    await waitForUI();
    assert.equal(
      document.getText(),
      "import '@openzeppelin/contracts/access/AccessControl.sol';"
    );
  });
});
