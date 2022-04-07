import { assert } from "chai";
import { Diagnostic, TextEdit } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { CompilerDiagnostic } from "@compilerDiagnostics/types";
import { setupMockWorkspaceFileRetriever } from "../../../../helpers/setupMockWorkspaceFileRetriever";
import { setupMockLogger } from "../../../../helpers/setupMockLogger";
import { setupMockConnection } from "../../../../helpers/setupMockConnection";
import { indexWorkspaceFolders } from "@services/initialization/indexWorkspaceFolders";
import { ServerState } from "types";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockConnection = setupMockConnection() as any;

  const serverState = {
    workspaceFolders: [{ name: "example", uri: exampleUri }],
    connection: mockConnection,
    solFileIndex: {},
    logger: mockLogger,
  };

  await indexWorkspaceFolders(serverState, mockWorkspaceFileRetriever);

  const actions = compilerDiagnostic.resolveActions(
    serverState as ServerState,
    diagnostic,
    {
      document,
      uri: exampleUri,
    }
  );

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
