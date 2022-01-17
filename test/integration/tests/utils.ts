"use strict";

import * as fs from "fs";
import * as path from "path";

import { getClient } from "../client";
import { getDocUri } from "../common/helper";
import { IntegrationSamples, Client } from "../common/types";

export function runTestFromJSON(testPath: string, jsonName: string): void {
  let client!: Client;

  suiteSetup(async () => {
    client = await getClient();
  });

  const integrationSamples: IntegrationSamples[] = JSON.parse(
    fs.readFileSync(path.join(testPath, jsonName), "utf8")
  );
  for (const sample of integrationSamples) {
    test(sample.title, async () => {
      for (const action of sample.actions) {
        const docUri = getDocUri(testPath, action.uri);

        if (client.docUri?.path !== docUri.path) {
          await client.changeDocument(docUri);
        }

        const fn = client.navigationProvider[`do${action.action}`].bind(
          client.navigationProvider
        );
        if (!fn) {
          throw new Error("Action request not implemented!");
        }

        await fn(client.document, action);
      }
    });
  }
}
