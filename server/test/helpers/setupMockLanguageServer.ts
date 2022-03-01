import { assert } from "chai";
import * as fs from "fs";
import * as path from "path";
import { getUriFromDocument } from "../../src/utils/index";
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
} from "vscode-languageserver/node";
import setupServer from "../../src/server";
import { setupMockCompilerProcessFactory } from "./setupMockCompilerProcessFactory";
import { setupMockConnection } from "./setupMockConnection";
import { waitUntil } from "./waitUntil";
import { setupMockLogger } from "./setupMockLogger";
import { setupMockWorkspaceFileRetriever } from "./setupMockWorkspaceFileRetriever";
import { setupMockTelemetry } from "./setupMockTelemetry";

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

export async function setupMockLanguageServer({
  documents,
  errors,
}: {
  documents: { uri: string; content?: string; analyze: boolean }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: any[];
}) {
  const exampleRootUri = path.join(__dirname, "..");
  const mockConnection = setupMockConnection();
  const mockCompilerProcessFactory = setupMockCompilerProcessFactory(errors);
  const mockWorkspaceFileRetriever = setupMockWorkspaceFileRetriever();
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

  const didOpenTextDocument =
    mockConnection.onDidOpenTextDocument.getCall(0).firstArg;

  for (const { uri: documentUri, content, analyze } of documents) {
    const fileContent = content ?? (await fs.promises.readFile(documentUri));

    const textDocument: TextDocumentItem = {
      uri: documentUri,
      languageId: "solidity",
      version: 0,
      text: fileContent.toString(),
    };

    await didOpenTextDocument({ textDocument: textDocument });

    if (!analyze) {
      continue;
    }

    try {
      await waitUntil(
        () => {
          const doc = serverState.documents.get(documentUri);

          if (!doc || !serverState.languageServer) {
            return false;
          }

          const localUri = getUriFromDocument(doc);

          const documentAnalyzer =
            serverState.languageServer.analyzer.getDocumentAnalyzer(localUri);

          return documentAnalyzer && documentAnalyzer.isAnalyzed;
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
    },
  };
}
