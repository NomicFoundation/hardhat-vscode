import * as Sentry from "@sentry/node";
import { Connection } from "vscode-languageserver";
import {
  TextDocuments,
  InitializeParams,
  CompletionList,
  CompletionParams,
  TextDocumentSyncKind,
  InitializeResult,
  SignatureHelpParams,
  SignatureHelp,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";

import {
  writeAnalytics,
  getAnalyticsData,
  getAnalytics,
  Analytics,
} from "./analytics";
import { IndexFileData, eventEmitter as em } from "@common/event";
import { ValidationJob } from "@services/validation/SolidityValidation";
import { getUriFromDocument, decodeUriAndRemoveFilePrefix } from "./utils";
import { debounce } from "./utils/debaunce";
import { LanguageService } from "./parser";
import { compilerProcessFactory } from "@services/validation/compilerProcessFactory";
import { buildOnCodeAction } from "./codeactions/buildOnCodeAction";

type ServerState = {
  connection: Connection;
  documents: TextDocuments<TextDocument>;
  rootUri: string | null;
  hasWorkspaceFolderCapability: boolean;
  languageServer: LanguageService | null;
  analytics: Analytics | null;
};

const debounceAnalyzeDocument: {
  [uri: string]: (
    documents: TextDocuments<TextDocument>,
    uri: string,
    languageServer: LanguageService,
    connection: Connection
  ) => void;
} = {};

const debounceValidateDocument: {
  [uri: string]: (
    connection: Connection,
    validationJob: ValidationJob,
    uri: string,
    document: TextDocument
  ) => void;
} = {};

type UnsavedDocumentType = {
  uri: string;
  languageId: string;
  version: number;
  content: string;
};

export default function setupServer(
  connection: Connection,
  compProcessFactory: typeof compilerProcessFactory
): ServerState {
  const serverState: ServerState = {
    connection,
    documents: new TextDocuments(TextDocument),
    languageServer: null,
    analytics: null,
    rootUri: null,
    hasWorkspaceFolderCapability: false,
  };

  connection.onInitialize(resolveOnInitialize(serverState));

  connection.onInitialized(async () => {
    connection.console.log("server onInitialized");

    const analyticsData = await getAnalyticsData();

    if (analyticsData.isAllowed === undefined) {
      const isAllowed = await isAnalyticsAllowed(connection);
      analyticsData.isAllowed = isAllowed;
      await writeAnalytics(analyticsData);
    }

    serverState.analytics = await getAnalytics();
    const startTime = Date.now();

    if (!serverState.rootUri) {
      throw new Error("Root Uri not set");
    }

    serverState.languageServer = new LanguageService(
      serverState.rootUri,
      compProcessFactory,
      connection.console
    );

    serverState.analytics.sendTaskHit("indexing", {
      plt: Date.now() - startTime,
    });

    if (serverState.hasWorkspaceFolderCapability) {
      connection.workspace.onDidChangeWorkspaceFolders(() => {
        connection.console.log("Workspace folder change event received.");
      });
    }
  });

  connection.onSignatureHelp(
    (params: SignatureHelpParams): SignatureHelp | undefined => {
      connection.console.log("server onSignatureHelp");

      try {
        const document = serverState.documents.get(params.textDocument.uri);

        if (document && serverState.languageServer) {
          const documentURI = getUriFromDocument(document);

          if (params.context?.triggerCharacter === "(") {
            serverState.languageServer.analyzer.analyzeDocument(
              document.getText(),
              documentURI
            );
          }

          const documentAnalyzer =
            serverState.languageServer.analyzer.getDocumentAnalyzer(
              documentURI
            );

          if (documentAnalyzer.isAnalyzed) {
            return serverState.languageServer.soliditySignatureHelp.doSignatureHelp(
              document,
              params.position,
              documentAnalyzer
            );
          }
        }
      } catch (err) {
        Sentry.captureException(err);
        console.error(err);
      }
    }
  );

  // This handler provides the initial list of the completion items.
  connection.onCompletion(
    (params: CompletionParams): CompletionList | undefined => {
      connection.console.log("server onCompletion");

      try {
        const document = serverState.documents.get(params.textDocument.uri);

        if (document && serverState.languageServer) {
          const documentText = document.getText();
          let newDocumentText = documentText;

          // Hack if triggerCharacter was "." then we insert ";" because the tolerance mode @solidity-parser/parser crashes as we type.
          // This only happens if there is no ";" at the end of the line.
          if (params.context?.triggerCharacter === ".") {
            const cursorOffset = document.offsetAt(params.position);
            const eofOffset =
              documentText.indexOf("\n", cursorOffset) > cursorOffset
                ? documentText.indexOf("\n", cursorOffset)
                : cursorOffset;
            newDocumentText =
              documentText.slice(0, cursorOffset) +
              "_;" +
              documentText.slice(cursorOffset, eofOffset) +
              ";";
          }

          const documentURI = getUriFromDocument(document);
          serverState.languageServer.analyzer.analyzeDocument(
            newDocumentText,
            documentURI
          );

          const documentAnalyzer =
            serverState.languageServer.analyzer.getDocumentAnalyzer(
              documentURI
            );

          if (documentAnalyzer) {
            return serverState.languageServer.solidityCompletion.doComplete(
              params.position,
              documentAnalyzer
            );
          }
        }
      } catch (err) {
        Sentry.captureException(err);
        console.error(err);
      }
    }
  );

  connection.onDefinition((params) => {
    connection.console.log("onDefinition");

    try {
      const document = serverState.documents.get(params.textDocument.uri);

      if (document && serverState.languageServer) {
        const documentURI = getUriFromDocument(document);
        const documentAnalyzer =
          serverState.languageServer.analyzer.getDocumentAnalyzer(documentURI);

        if (documentAnalyzer.isAnalyzed) {
          const startTime = Date.now();
          const result =
            serverState.languageServer.solidityNavigation.findDefinition(
              documentURI,
              params.position,
              documentAnalyzer.analyzerTree.tree
            );

          serverState.analytics?.sendTaskHit("onDefinition", {
            plt: Date.now() - startTime,
          });

          return result;
        }
      }
    } catch (err) {
      Sentry.captureException(err);
      console.error(err);
    }
  });

  connection.onTypeDefinition((params) => {
    connection.console.log("onTypeDefinition");

    try {
      const document = serverState.documents.get(params.textDocument.uri);

      if (document && serverState.languageServer) {
        const documentURI = getUriFromDocument(document);
        const documentAnalyzer =
          serverState.languageServer.analyzer.getDocumentAnalyzer(documentURI);

        if (documentAnalyzer.isAnalyzed) {
          const startTime = Date.now();
          const result =
            serverState.languageServer.solidityNavigation.findTypeDefinition(
              documentURI,
              params.position,
              documentAnalyzer.analyzerTree.tree
            );

          serverState.analytics?.sendTaskHit("onTypeDefinition", {
            plt: Date.now() - startTime,
          });

          return result;
        }
      }
    } catch (err) {
      Sentry.captureException(err);
      console.error(err);
    }
  });

  connection.onReferences((params) => {
    connection.console.log("onReferences");

    try {
      const document = serverState.documents.get(params.textDocument.uri);

      if (document && serverState.languageServer) {
        const documentURI = getUriFromDocument(document);
        const documentAnalyzer =
          serverState.languageServer.analyzer.getDocumentAnalyzer(documentURI);

        if (documentAnalyzer.isAnalyzed) {
          const startTime = Date.now();
          const result =
            serverState.languageServer.solidityNavigation.findReferences(
              documentURI,
              params.position,
              documentAnalyzer.analyzerTree.tree
            );

          serverState.analytics?.sendTaskHit("onReferences", {
            plt: Date.now() - startTime,
          });

          return result;
        }
      }
    } catch (err) {
      Sentry.captureException(err);
      console.error(err);
    }
  });

  connection.onImplementation((params) => {
    connection.console.log("onImplementation");

    try {
      const document = serverState.documents.get(params.textDocument.uri);

      if (document && serverState.languageServer) {
        const documentURI = getUriFromDocument(document);
        const documentAnalyzer =
          serverState.languageServer.analyzer.getDocumentAnalyzer(documentURI);

        if (documentAnalyzer.isAnalyzed) {
          const startTime = Date.now();
          const result =
            serverState.languageServer.solidityNavigation.findImplementation(
              documentURI,
              params.position,
              documentAnalyzer.analyzerTree.tree
            );

          serverState.analytics?.sendTaskHit("onImplementation", {
            plt: Date.now() - startTime,
          });

          return result;
        }
      }
    } catch (err) {
      Sentry.captureException(err);
      console.error(err);
    }
  });

  connection.onRenameRequest((params) => {
    connection.console.log("onRenameRequest");

    try {
      const document = serverState.documents.get(params.textDocument.uri);

      if (document && serverState.languageServer) {
        const documentURI = getUriFromDocument(document);
        const documentAnalyzer =
          serverState.languageServer.analyzer.getDocumentAnalyzer(documentURI);

        if (documentAnalyzer.isAnalyzed) {
          const startTime = Date.now();
          const result = serverState.languageServer.solidityNavigation.doRename(
            documentURI,
            document,
            params.position,
            params.newName,
            documentAnalyzer.analyzerTree.tree
          );

          serverState.analytics?.sendTaskHit("onRenameRequest", {
            plt: Date.now() - startTime,
          });

          return result;
        }
      }
    } catch (err) {
      Sentry.captureException(err);
      console.error(err);
    }
  });

  // Create a simple text document manager.
  const documents: TextDocuments<TextDocument> = new TextDocuments(
    TextDocument
  );

  connection.onCodeAction(buildOnCodeAction(connection, documents));

  // The content of a text document has changed. This event is emitted
  // when the text document first opened or when its content has changed.
  serverState.documents.onDidChangeContent((change) => {
    connection.console.log("server onDidChangeContent");

    if (
      !serverState.languageServer ||
      !serverState.languageServer.solidityValidation
    ) {
      return;
    }

    if (!debounceAnalyzeDocument[change.document.uri]) {
      debounceAnalyzeDocument[change.document.uri] = debounce(
        analyzeFunc,
        500,
        false
      );
    }

    debounceAnalyzeDocument[change.document.uri](
      serverState.documents,
      change.document.uri,
      serverState.languageServer,
      serverState.connection
    );

    // ------------------------------------------------------------------------

    if (!debounceValidateDocument[change.document.uri]) {
      debounceValidateDocument[change.document.uri] = debounce(
        validateTextDocument,
        500,
        false
      );
    }

    const documentURI = getUriFromDocument(change.document);
    const validationJob =
      serverState.languageServer.solidityValidation.getValidationJob();

    debounceValidateDocument[change.document.uri](
      connection,
      validationJob,
      documentURI,
      change.document
    );
  });

  // Make the text document manager listen on the connection
  // for open, change and close text document events
  serverState.documents.listen(connection);

  em.on("indexing-file", (data: IndexFileData) => {
    connection.sendNotification("custom/indexing-file", data);
  });

  return serverState;
}

async function isAnalyticsAllowed(connection: Connection): Promise<boolean> {
  connection.sendNotification("custom/analytics-allowed");

  try {
    const isAllowed: boolean = await new Promise((resolve, reject) => {
      // Set up the timeout
      const timeout = setTimeout(() => {
        reject("Timeout on wait for analytics allowed event");
      }, 30000);

      connection.onNotification(
        "custom/analytics-allowed",
        (allowed: boolean) => {
          clearTimeout(timeout);
          resolve(allowed);
        }
      );
    });

    return isAllowed;
  } catch (err) {
    return false;
  }
}

function analyzeFunc(
  documents: TextDocuments<TextDocument>,
  uri: string,
  languageServer: LanguageService,
  connection: Connection
): void {
  connection.console.log("debounced onDidChangeContent");

  try {
    const document = documents.get(uri);

    if (document) {
      const documentURI = getUriFromDocument(document);
      languageServer.analyzer.analyzeDocument(document.getText(), documentURI);
    }
  } catch (err) {
    Sentry.captureException(err);
    console.error(err);
  }
}

async function getUnsavedDocuments(
  connection: Connection
): Promise<TextDocument[]> {
  connection.sendNotification("custom/get-unsaved-documents");

  return new Promise((resolve, reject) => {
    // Set up the timeout
    const timeout = setTimeout(() => {
      reject("Timeout on getUnsavedDocuments");
    }, 15000);

    connection.onNotification(
      "custom/get-unsaved-documents",
      (unsavedDocuments: UnsavedDocumentType[]) => {
        const unsavedTextDocuments = unsavedDocuments.map((ud) => {
          return TextDocument.create(
            ud.uri,
            ud.languageId,
            ud.version,
            ud.content
          );
        });

        clearTimeout(timeout);
        resolve(unsavedTextDocuments);
      }
    );
  });
}

async function validateTextDocument(
  connection: Connection,
  validationJob: ValidationJob,
  uri: string,
  document: TextDocument
): Promise<void> {
  connection.console.log("validateTextDocument");

  try {
    const unsavedDocuments = await getUnsavedDocuments(connection);
    const diagnostics = await validationJob.run(
      uri,
      document,
      unsavedDocuments
    );

    // Send the calculated diagnostics to VSCode, but only for the file over which we called validation.
    for (const diagnosticUri of Object.keys(diagnostics)) {
      if (uri.includes(diagnosticUri)) {
        connection.sendDiagnostics({
          uri: document.uri,
          diagnostics: diagnostics[diagnosticUri],
        });

        return;
      }
    }
  } catch (err) {
    // console.error(err);
  }

  connection.sendDiagnostics({
    uri: document.uri,
    diagnostics: [],
  });
}

const resolveOnInitialize = (serverState: ServerState) => {
  return (params: InitializeParams) => {
    serverState.connection.console.log("server onInitialize");

    /**
     * We know that rootUri is deprecated but we need it.
     * We will monitor https://github.com/microsoft/vscode-extension-samples/issues/207 issue,
     * so when it will be resolved we can update how we get rootUri.
     */
    if (params.rootUri) {
      serverState.rootUri = decodeUriAndRemoveFilePrefix(params.rootUri);
    }

    const capabilities = params.capabilities;

    serverState.hasWorkspaceFolderCapability = !!(
      capabilities.workspace && !!capabilities.workspace.workspaceFolders
    );

    const result: InitializeResult = {
      capabilities: {
        textDocumentSync: TextDocumentSyncKind.Incremental,
        // Tell the client that this server supports code completion.
        completionProvider: {
          triggerCharacters: [".", "/"],
        },
        signatureHelpProvider: {
          triggerCharacters: ["(", ","],
        },
        definitionProvider: true,
        typeDefinitionProvider: true,
        referencesProvider: true,
        implementationProvider: true,
        renameProvider: true,
        codeActionProvider: true,
      },
    };

    if (serverState.hasWorkspaceFolderCapability) {
      result.capabilities.workspace = {
        workspaceFolders: {
          supported: true,
        },
      };
    }

    return result;
  };
};
