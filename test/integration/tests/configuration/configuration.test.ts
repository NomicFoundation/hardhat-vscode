import * as assert from "assert";
import * as lsclient from "vscode-languageclient/node";

import { getClient } from "../../client";
import { Client } from "../../common/types";

suite("Configuration", function () {
  this.timeout(60000);

  let client!: Client;
  let vscodeClient!: lsclient.LanguageClient;

  suiteSetup(async () => {
    client = await getClient();
    vscodeClient = client.getVSCodeClient();
  });

  test("InitializeResult", () => {
    const expected = {
      capabilities: {
        textDocumentSync: 2,
        codeActionProvider: true,
        completionProvider: {
          triggerCharacters: [".", "/", '"'],
        },
        signatureHelpProvider: {
          triggerCharacters: ["(", ","],
        },
        definitionProvider: true,
        hoverProvider: true,
        typeDefinitionProvider: true,
        referencesProvider: true,
        implementationProvider: true,
        renameProvider: true,
        workspace: {
          workspaceFolders: {
            supported: true,
            changeNotifications: true,
          },
        },
      },
    };

    assert.deepStrictEqual(vscodeClient.initializeResult, expected);
  });
});
