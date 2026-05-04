import { assert } from "chai";
import {
  Diagnostic,
  TextEdit,
  WorkspaceFolder,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { CompilerDiagnostic } from "@compilerDiagnostics/types";
import { getOrInitialiseSolFileEntry } from "@utils/getOrInitialiseSolFileEntry";
import { clearCompilationCache } from "../../../../src/parser/compilation";
import { setupMockLogger } from "../../../helpers/setupMockLogger";
import { setupMockConnection } from "../../../helpers/setupMockConnection";
import { ServerState } from "../../../../src/types";

export async function assertCodeAction(
  compilerDiagnostic: CompilerDiagnostic,
  docText: string,
  diagnostic: Diagnostic,
  expectedActions: Array<null | {
    title: string;
    kind: string;
    isPreferred: boolean;
    edits: TextEdit[];
  }>
) {
  const exampleUri = "/example";

  const document = TextDocument.create(exampleUri, "solidity", 0, docText);

  const mockLogger = setupMockLogger();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockConnection = setupMockConnection() as any;

  // Mock documents manager for compilation
  const mockDocuments = {
    get: (uri: string) => {
      if (uri === "file:///example") {
        return document;
      }

      return undefined;
    },
  };

  const serverState = {
    indexJobCount: 0,
    indexedWorkspaceFolders: [] as WorkspaceFolder[],
    projects: {},
    connection: mockConnection,
    solFileIndex: {},
    logger: mockLogger,
    documents: mockDocuments,
  } as unknown as ServerState;

  getOrInitialiseSolFileEntry(serverState, exampleUri);

  // Clear compilation cache to avoid stale data between tests
  clearCompilationCache();

  const actions = await compilerDiagnostic.resolveActions(
    serverState as ServerState,
    diagnostic,
    {
      document,
      uri: exampleUri,
    }
  );

  assert(actions);
  assert.equal(actions.length, expectedActions.length);

  // eslint-disable-next-line guard-for-in
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
