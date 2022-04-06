import * as events from "events";
import { assert } from "chai";
import { Diagnostic, TextEdit } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { CompilerDiagnostic } from "@compilerDiagnostics/types";
import { Analyzer } from "@analyzer/index";
import { getUriFromDocument } from "../../../../../src/utils";
import { setupMockWorkspaceFileRetriever } from "../../../../helpers/setupMockWorkspaceFileRetriever";
import { setupMockLogger } from "../../../../helpers/setupMockLogger";

export async function assertCodeAction(
  compilerDiagnostic: CompilerDiagnostic,
  docText: string,
  diagnostic: Diagnostic,
  expectedActions: (null | {
    title: string;
    kind: string;
    isPreferred: boolean;
    edits: TextEdit[];
  })[]
) {
  const exampleUri = "/example";

  const document = TextDocument.create(exampleUri, "solidity", 0, docText);

  const mockLogger = setupMockLogger();
  const mockWorkspaceFileRetriever = setupMockWorkspaceFileRetriever();

  const em = new events.EventEmitter();

  const analyzer = await new Analyzer(
    mockWorkspaceFileRetriever,
    em,
    mockLogger
  ).init([{ name: "example", uri: exampleUri }]);

  const documentURI = getUriFromDocument(document);
  analyzer.analyzeDocument(document.getText(), documentURI);

  const actions = compilerDiagnostic.resolveActions(diagnostic, {
    document,
    uri: exampleUri,
    analyzer: analyzer,
    logger: mockLogger,
  });

  assert(actions);
  assert.equal(actions.length, expectedActions.length);

  for (const index in expectedActions) {
    const expectedAction = expectedActions[index];

    if (expectedAction === null) {
      continue;
    }

    const { title, kind, isPreferred, edits } = expectedAction;
    const action = actions[index];
    assert.equal(action.title, title);
    assert.equal(action.kind, kind);
    assert.equal(action.isPreferred, isPreferred);
    assert.deepStrictEqual(action.edit?.changes?.[exampleUri], edits);
  }
}
