import { assert } from "chai";
import { Diagnostic, TextEdit } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { CompilerDiagnostic } from "../../../../src/compilerDiagnostics/types";

export function assertCodeAction(
  compilerDiagnostic: CompilerDiagnostic,
  docText: string,
  diagnostic: Diagnostic,
  expectedActions: {
    title: string;
    kind: string;
    isPreferred: boolean;
    edits: TextEdit[];
  }[]
) {
  const exampleUri = "/example";

  const document = TextDocument.create(exampleUri, "solidity", 0, docText);

  const actions = compilerDiagnostic.resolveActions(diagnostic, {
    document,
    uri: exampleUri,
  });

  assert(actions);
  assert.equal(actions.length, expectedActions.length);

  for (const index in expectedActions) {
    const { title, kind, isPreferred, edits } = expectedActions[index];
    const action = actions[index];
    assert.equal(action.title, title);
    assert.equal(action.kind, kind);
    assert.equal(action.isPreferred, isPreferred);
    assert.deepStrictEqual(action.edit?.changes?.[exampleUri], edits);
  }
}
