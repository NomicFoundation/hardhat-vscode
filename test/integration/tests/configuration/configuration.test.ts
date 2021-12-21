"use strict";

import * as fs from "fs";
import * as path from "path";
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
    const expected = JSON.parse(
      fs.readFileSync(path.join(__dirname, "configuration.test.json"), "utf8")
    );
    assert.deepStrictEqual(vscodeClient.initializeResult, expected);
  });
});
