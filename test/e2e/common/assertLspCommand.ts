import * as lsclient from "vscode-languageclient/node";
import * as vscode from "vscode";
import * as assert from "assert";

import {
  isArray,
  isDefined,
  rangeEqual,
  uriEqual,
} from "../helpers/assertions";
import { Client, Action } from "./types";

export async function assertLspCommand(client: Client, action: Action) {
  await ensureValidationOfDoc(client, action);

  switch (action.action) {
    case "DefinitionRequest":
      await assertDefinitionRequestResult(client, action);
      break;
    case "TypeDefinitionRequest":
      await assertTypeDefinitionRequestResult(client, action);
      break;
    case "ReferencesRequest":
      await assertReferencesRequestResult(client, action);
      break;
    case "ImplementationRequest":
      await assertImplementationRequestResult(client, action);
      break;
    case "RenameRequest":
      await assertRenameRequestResult(client, action);
      break;
    default:
      assert.fail(`unknown action type: ${action.action}`);
  }
}

async function ensureValidationOfDoc(client: Client, action: Action) {
  if (client.docUri?.path !== action.uri) {
    await client.changeDocument(vscode.Uri.file(action.uri));
  }
}

async function assertDefinitionRequestResult(
  wrapClient: Client,
  action: Action
) {
  const { client, tokenSource, document } = wrapClient;

  if (!document) {
    throw new Error("Document not set");
  }

  const provider = client
    .getFeature(lsclient.DefinitionRequest.method)
    .getProvider(document);

  isDefined(provider);

  const position = resolvePosition(action);

  const result = (await provider.provideDefinition(
    document,
    position,
    tokenSource.token
  )) as vscode.Location;

  assert.ok(
    result instanceof vscode.Location,
    `Did not return a location instance: \n${JSON.stringify(result, null, 2)}`
  );

  uriEqual(result.uri, action.expected[0].uri, "Uri did not match");

  rangeEqual(
    result.range,
    action.expected[0].range[0].line,
    action.expected[0].range[0].character,
    action.expected[0].range[1].line,
    action.expected[0].range[1].character
  );
}

async function assertTypeDefinitionRequestResult(
  wrapClient: Client,
  action: Action
): Promise<void> {
  const { client, tokenSource, document } = wrapClient;

  if (!document) {
    throw new Error("Document not set");
  }

  const provider = client
    .getFeature(lsclient.TypeDefinitionRequest.method)
    .getProvider(document);

  isDefined(provider);

  const position = resolvePosition(action);

  const results = (await provider.provideTypeDefinition(
    document,
    position,
    tokenSource.token
  )) as vscode.Location[];

  isArray(results, action.expected.length);

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const expected = action.expected[i];

    assert.ok(
      result instanceof vscode.Location,
      `Not a location instance: \n${JSON.stringify(result, null, 2)}`
    );

    uriEqual(result.uri, expected.uri);
    rangeEqual(
      result.range,
      expected.range[0].line,
      expected.range[0].character,
      expected.range[1].line,
      expected.range[1].character
    );
  }
}

async function assertReferencesRequestResult(
  wrapClient: Client,
  action: Action
): Promise<void> {
  const { client, tokenSource, document } = wrapClient;

  if (!document) {
    throw new Error("Document not set");
  }

  const provider = client
    .getFeature(lsclient.ReferencesRequest.method)
    .getProvider(document);

  isDefined(provider);

  const position = resolvePosition(action);

  const results = (await provider.provideReferences(
    document,
    position,
    {
      includeDeclaration: true,
    },
    tokenSource.token
  )) as vscode.Location[];

  isArray(results, action.expected.length);

  const sortedResults = results.sort(
    (l, r) =>
      l.uri.path.localeCompare(r.uri.path) ||
      l.range.start.line - r.range.start.line ||
      l.range.start.character - r.range.start.character ||
      l.range.end.line - r.range.end.line ||
      l.range.end.character - r.range.end.character
  );

  const sortedExpected = action.expected.sort(
    (l, r) =>
      l.uri.path.localeCompare(r.uri.path) ||
      l.range[0].line - r.range[0].line ||
      l.range[0].character - r.range[0].character ||
      l.range[1].line - r.range[1].line ||
      l.range[1].character - r.range[1].character
  );

  for (let i = 0; i < sortedResults.length; i++) {
    const result = sortedResults[i];
    const expected = sortedExpected[i];

    assert.ok(
      result instanceof vscode.Location,
      `Not a location instance: \n${JSON.stringify(result, null, 2)}`
    );

    uriEqual(result.uri, expected.uri);

    rangeEqual(
      result.range,
      expected.range[0].line,
      expected.range[0].character,
      expected.range[1].line,
      expected.range[1].character
    );
  }
}

async function assertImplementationRequestResult(
  wrapClient: Client,
  action: Action
): Promise<void> {
  const { client, tokenSource, document } = wrapClient;

  if (!document) {
    throw new Error("Document not set");
  }

  const provider = client
    .getFeature(lsclient.ImplementationRequest.method)
    .getProvider(document);

  isDefined(provider);

  const position = resolvePosition(action);

  const results = (await provider.provideImplementation(
    document,
    position,
    tokenSource.token
  )) as vscode.Location[];

  isArray(results, action.expected.length);
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const expected = action.expected[i];

    assert.ok(
      result instanceof vscode.Location,
      `Not a location instance: \n${JSON.stringify(result, null, 2)}`
    );

    uriEqual(result.uri, expected.uri);

    rangeEqual(
      result.range,
      expected.range[0].line,
      expected.range[0].character,
      expected.range[1].line,
      expected.range[1].character
    );
  }
}

async function assertRenameRequestResult(
  wrapClient: Client,
  action: Action
): Promise<void> {
  const { client, tokenSource, document } = wrapClient;

  if (!document) {
    throw new Error("Document not set");
  }

  const provider = client
    .getFeature(lsclient.RenameRequest.method)
    .getProvider(document);

  isDefined(provider);

  if (action.params === undefined || action.params.new_name === undefined) {
    throw new Error("No new name in params");
  }

  const position = resolvePosition(action);

  const renameResult = await provider.provideRenameEdits(
    document,
    position,
    action.params.new_name,
    tokenSource.token
  );

  if (!renameResult) {
    assert.fail("No rename result");
  }

  isArray(renameResult.entries(), action.expected.length);

  assert.ok(
    renameResult instanceof vscode.WorkspaceEdit,
    `Not a Uri instance: \n${JSON.stringify(renameResult, null, 2)}`
  );

  for (let i = 0; i < renameResult.entries().length; i++) {
    const results: [vscode.Uri, vscode.TextEdit[]] = renameResult.entries()[i];
    const expected = action.expected[i];

    if (results.length !== 2) {
      throw new Error(
        `Result [vscode.Uri, vscode.TextEdit[]].length must be 2`
      );
    }

    assert.ok(
      results[0] instanceof vscode.Uri,
      `Not a Uri instance: \n${JSON.stringify(results[0], null, 2)}`
    );

    uriEqual(results[0], expected[0]);

    const textEdits = results[1];

    isArray(textEdits, expected[1].length);
    for (let j = 0; j < textEdits.length; j++) {
      assert.ok(
        textEdits[j] instanceof vscode.TextEdit,
        `Not a TextEdit instance: \n${JSON.stringify(textEdits[j], null, 2)}`
      );

      const textEdit = textEdits[j];

      assert.strictEqual(textEdit.newText, expected[1][j].newText);
      rangeEqual(
        textEdit.range,
        expected[1][j].range[0].line,
        expected[1][j].range[0].character,
        expected[1][j].range[1].line,
        expected[1][j].range[1].character
      );
    }
  }
}

function resolvePosition(action: Action) {
  if (!action.params?.position) {
    throw new Error("No position in params");
  }

  return new vscode.Position(
    action.params.position.line,
    action.params.position.character
  );
}
