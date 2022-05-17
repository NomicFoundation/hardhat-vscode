import { assert } from "chai";
import * as fs from "fs";
import * as path from "path";
import {
  CompletionItem,
  CompletionList,
  CompletionParams,
  Definition,
  DefinitionLink,
  DefinitionParams,
  TypeDefinitionParams,
  SignatureHelp,
  SignatureHelpParams,
  TextDocumentItem,
  ReferenceParams,
  ImplementationParams,
  Location,
  RenameParams,
  WorkspaceEdit,
  HoverParams,
  Hover,
} from "vscode-languageserver/node";
import { getOrInitialiseSolFileEntry } from "@utils/getOrInitialiseSolFileEntry";
import { getUriFromDocument } from "../../src/utils/index";
import setupServer, {
  GetSolFileDetailsParams,
  GetSolFileDetailsResponse,
} from "../../src/server";
import type { HardhatCompilerError } from "../../src/types";
import { setupMockCompilerProcessFactory } from "./setupMockCompilerProcessFactory";
import { setupMockConnection } from "./setupMockConnection";
import { waitUntil } from "./waitUntil";
import { setupMockLogger } from "./setupMockLogger";
import { setupMockWorkspaceFileRetriever } from "./setupMockWorkspaceFileRetriever";
import { setupMockTelemetry } from "./setupMockTelemetry";
import { forceToUnixStyle } from "./forceToUnixStyle";

export type OnSignatureHelp = (
  params: SignatureHelpParams
) => SignatureHelp | undefined | null;
export type OnCompletion = (
  params: CompletionParams
) => CompletionItem[] | CompletionList | undefined | null;
export type OnDefinition = (
  params: DefinitionParams
) => Definition | DefinitionLink[] | undefined | null;
export type OnTypeDefinition = (
  params: TypeDefinitionParams
) => Definition | DefinitionLink[] | null;
export type OnReferences = (
  params: ReferenceParams
) => Location[] | undefined | null;
export type OnImplementation = (
  params: ImplementationParams
) => Location[] | undefined | null;
export type OnRenameRequest = (
  params: RenameParams
) => WorkspaceEdit | undefined | null;
export type OnHover = (params: HoverParams) => Hover | null;
export type OnRequest = (
  params: GetSolFileDetailsParams
) => GetSolFileDetailsResponse;

export async function setupMockLanguageServer({
  projects,
  documents,
  errors,
}: {
  projects?: { [key: string]: string[] };
  documents: Array<{ uri: string; content?: string; analyze: boolean }>;
  errors: HardhatCompilerError[];
}) {
  const exampleRootUri = forceToUnixStyle(path.join(__dirname, ".."));
  const exampleWorkspaceFolders = [{ name: "example", uri: exampleRootUri }];

  const mockConnection = setupMockConnection();
  const mockCompilerProcessFactory = setupMockCompilerProcessFactory(errors);
  const mockWorkspaceFileRetriever = setupMockWorkspaceFileRetriever(
    projects ?? {}
  );
  const mockTelemetry = setupMockTelemetry();
  const mockLogger = setupMockLogger();

  const serverState = await setupServer(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockConnection as any,
    mockCompilerProcessFactory,
    mockWorkspaceFileRetriever,
    mockTelemetry,
    mockLogger
  );

  assert(mockConnection.onInitialize.called);
  const initialize = mockConnection.onInitialize.getCall(0).firstArg;
  assert(initialize);
  const initializeResponse = await initialize({
    rootUri: exampleRootUri,
    workspaceFolders: exampleWorkspaceFolders,
    capabilities: {},
  });

  assert(initializeResponse);

  assert(mockConnection.onInitialized.called);
  const initialized = mockConnection.onInitialized.getCall(0).firstArg;
  assert(initialized);

  await initialized({ rootUri: exampleRootUri, capabilities: {} });

  const signatureHelp: OnSignatureHelp =
    mockConnection.onSignatureHelp.getCall(0).firstArg;
  const completion: OnCompletion =
    mockConnection.onCompletion.getCall(0).firstArg;
  const definition: OnDefinition =
    mockConnection.onDefinition.getCall(0).firstArg;
  const typeDefinition: OnTypeDefinition =
    mockConnection.onTypeDefinition.getCall(0).firstArg;
  const references: OnReferences =
    mockConnection.onReferences.getCall(0).firstArg;
  const implementation: OnImplementation =
    mockConnection.onImplementation.getCall(0).firstArg;
  const renameRequest: OnRenameRequest =
    mockConnection.onRenameRequest.getCall(0).firstArg;
  const hover: OnHover = mockConnection.onHover.getCall(0).firstArg;
  const request: OnRequest = mockConnection.onRequest.getCall(0).args[1];

  const didOpenTextDocument =
    mockConnection.onDidOpenTextDocument.getCall(0).firstArg;

  for (const { uri, content, analyze } of documents) {
    const documentUri = forceToUnixStyle(uri);
    const fileContent = content ?? (await fs.promises.readFile(uri));

    const textDocument: TextDocumentItem = {
      uri: documentUri,
      languageId: "solidity",
      version: 0,
      text: fileContent.toString(),
    };

    await didOpenTextDocument({ textDocument });

    if (!analyze) {
      continue;
    }

    try {
      await waitUntil(
        () => {
          const doc = serverState.documents.get(documentUri);

          if (!doc) {
            return false;
          }

          const localUri = getUriFromDocument(doc);

          const documentAnalyzer = getOrInitialiseSolFileEntry(
            serverState,
            localUri
          );

          return documentAnalyzer.isAnalyzed();
        },
        100,
        1600
      );
    } catch (err) {
      throw new Error(
        `Timeout waiting for doc analysis for ${documentUri} - error ${err}`
      );
    }
  }

  return {
    connection: mockConnection,
    server: {
      signatureHelp,
      completion,
      definition,
      typeDefinition,
      references,
      implementation,
      renameRequest,
      hover,
      request,
    },
  };
}
