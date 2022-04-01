"use strict";

import * as lsclient from "vscode-languageclient/node";
import * as vscode from "vscode";
import * as assert from "assert";

import { getClient } from "../../client";
import {
  getDocUri,
  isDefined,
  isInstanceOf,
  rangeEqual,
  uriEqual,
} from "../../common/helper";
import { Client, Action } from "../../common/types";

suite("Single-file Navigation", function () {
  this.timeout(10000);

  let client!: Client;

  suiteSetup(async () => {
    client = await getClient();
  });

  test("[Single-file] - Go to Definition", async () => {
    const action = {
      action: "DefinitionRequest",
      uri: "./Test.sol",
      params: {
        position: {
          line: 14,
          character: 25,
        },
      },
      expected: [
        {
          uri: {
            path: "./Test.sol",
          },
          range: [
            {
              line: 9,
              character: 11,
            },
            {
              line: 9,
              character: 16,
            },
          ],
        },
      ],
    };

    const docUri = getDocUri(__dirname, action.uri);

    if (client.docUri?.path !== docUri.path) {
      await client.changeDocument(docUri);
    }

    const fn = client.navigationProvider[`do${action.action}`].bind(
      client.navigationProvider
    );

    if (!fn) {
      throw new Error("Action request not implemented!");
    }

    await assertDefinitionRequest(client, action);
  });

  // runTestFromJSON(__dirname, "navigation.test.json");
});

async function assertDefinitionRequest(wrapClient: Client, action: Action) {
  const { client, tokenSource, document } = wrapClient;

  const provider = client
    .getFeature(lsclient.DefinitionRequest.method)
    .getProvider(document);

  isDefined(provider);

  const position = new vscode.Position(
    action.params.position.line,
    action.params.position.character
  );

  const result = (await provider.provideDefinition(
    document,
    position,
    tokenSource.token
  )) as vscode.Location;

  assert.ok(
    result instanceof vscode.Location,
    `Did not return a location instance: \n${JSON.stringify(result, null, 2)}`
  );

  uriEqual(result.uri, action.expected[0].uri);

  rangeEqual(
    result.range,
    action.expected[0].range[0].line,
    action.expected[0].range[0].character,
    action.expected[0].range[1].line,
    action.expected[0].range[1].character
  );
}
