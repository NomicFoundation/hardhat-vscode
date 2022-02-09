import { assert } from "chai";
import * as sinon from "sinon";
import { Diagnostic, TextEdit } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { CompilerDiagnostic } from "@compilerDiagnostics/types";
import { Analyzer } from "@analyzer/index";
import { getUriFromDocument } from "../../../../../src/utils";

export function assertCodeAction(
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

  const analyzer = new Analyzer(exampleUri, {
    log: sinon.spy(),
    error: sinon.spy(),
  });

  const documentURI = getUriFromDocument(document);
  analyzer.analyzeDocument(document.getText(), documentURI);

  const actions = compilerDiagnostic.resolveActions(diagnostic, {
    document,
    uri: exampleUri,
    analyzer: analyzer,
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
