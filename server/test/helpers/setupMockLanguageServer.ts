import { assert } from "chai";
import * as fs from "fs";
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
} from "vscode-languageserver/node";
import setupServer from "../../src/server";
import { setupMockCompilerProcessFactory } from "./setupMockCompilerProcessFactory";
import { setupMockConnection } from "./setupMockConnection";

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

export async function setupMockLanguageServer({
  documents,
  errors,
}: {
  documents: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: any[];
}) {
  const mockConnection = setupMockConnection();
  const mockCompilerProcessFactory = setupMockCompilerProcessFactory(errors);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await setupServer(mockConnection as any, mockCompilerProcessFactory);

  assert(mockConnection.onInitialize.called);
  const initialize = mockConnection.onInitialize.getCall(0).firstArg;
  assert(initialize);
  const initializeResponse = await initialize({
    rootUri: null,
    capabilities: {},
  });
  assert(initializeResponse);

  assert(mockConnection.onInitialized.called);
  const initialized = mockConnection.onInitialized.getCall(0).firstArg;
  assert(initialized);
  await initialized({ rootUri: null, capabilities: {} });

  const signatureHelp: OnSignatureHelp =
    mockConnection.onSignatureHelp.getCall(0).firstArg;
  const completion: OnCompletion =
    mockConnection.onCompletion.getCall(0).firstArg;
  const definition: OnDefinition =
    mockConnection.onDefinition.getCall(0).firstArg;
  const typeDefinition: OnTypeDefinition =
    mockConnection.onTypeDefinition.getCall(0).firstArg;

  const didOpenTextDocument =
    mockConnection.onDidOpenTextDocument.getCall(0).firstArg;

  for (const documentUri of documents) {
    const fileContent = await fs.promises.readFile(documentUri);

    const textDocument: TextDocumentItem = {
      uri: documentUri,
      languageId: "solidity",
      version: 0,
      text: fileContent.toString(),
    };

    await didOpenTextDocument({ textDocument: textDocument });
  }

  return {
    connection: mockConnection,
    server: {
      signatureHelp,
      completion,
      definition,
      typeDefinition,
    },
  };
}
