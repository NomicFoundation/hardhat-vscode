import assert from "assert";
import * as vscode from "vscode";
import { getTestContractUri } from "../../helpers/getTestContract";
import { openFileInEditor, waitForUI } from "../../helpers/editor";
import { sleep } from "../../helpers/sleep";

const FLATTENED_MARKER = "Sources flattened with hardhat";
const OPEN_TIMEOUT = 20_000;
const TEXT_TIMEOUT = 20_000;

suite("commands - flatten", function () {
  this.retries(0);

  test("flatten via command palette", async () => {
    const uri = getTestContractUri("main/contracts/commands/Importer.sol");
    await openFileInEditor(uri);

    await vscode.commands.executeCommand(
      "workbench.action.quickOpen",
      ">Hardhat: Flatten"
    );
    await waitForUI();

    await vscode.commands.executeCommand(
      "workbench.action.acceptSelectedQuickOpenItem"
    );

    const flattened = await documentOpens(isFlattenOutput, OPEN_TIMEOUT);

    if (flattened === undefined) {
      assert.fail("flatten did not open an untitled Solidity document");
    }

    if (!(await textArrives(flattened, FLATTENED_MARKER, TEXT_TIMEOUT))) {
      assert.fail(
        `${FLATTENED_MARKER} never appeared in the opened document. ` +
          `After ${TEXT_TIMEOUT}ms it held ${flattened.getText().length} ` +
          `characters:\n${flattened.getText().slice(0, 800)}`
      );
    }
  });
});

/**
 * What `openNewDocument` creates for the flattened source: an untitled
 * Solidity document, as opposed to a file the editor happened to open.
 */
function isFlattenOutput(document: vscode.TextDocument): boolean {
  return (
    document.uri.scheme === "untitled" && document.languageId === "solidity"
  );
}

/** The next matching document to open, or undefined if none does in time. */
async function documentOpens(
  matches: (document: vscode.TextDocument) => boolean,
  timeout: number
): Promise<vscode.TextDocument | undefined> {
  return new Promise((resolve) => {
    const subscription = vscode.workspace.onDidOpenTextDocument((document) => {
      if (!matches(document)) {
        return;
      }

      clearTimeout(timer);
      subscription.dispose();
      resolve(document);
    });

    const timer = setTimeout(() => {
      subscription.dispose();
      resolve(undefined);
    }, timeout);
  });
}

/** Polls a document until it holds `marker`, or the timeout expires. */
async function textArrives(
  document: vscode.TextDocument,
  marker: string,
  timeout: number
): Promise<boolean> {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    if (document.getText().includes(marker)) {
      return true;
    }

    await sleep(100);
  }

  return false;
}
