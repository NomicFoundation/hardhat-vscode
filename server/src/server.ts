import * as events from "events";
import { Connection } from "vscode-languageserver";
import {
  TextDocuments,
  CompletionList,
  CompletionParams,
  SignatureHelpParams,
  SignatureHelp,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { IndexFileData } from "@common/event";
import { ValidationJob } from "./services/validation/SolidityValidation";
import { getUriFromDocument } from "./utils";
import { debounce } from "./utils/debaunce";
import { LanguageService } from "./parser";
import { compilerProcessFactory } from "./services/validation/compilerProcessFactory";
import { onCodeAction } from "./services/codeactions/onCodeAction";
import { WorkspaceFileRetriever } from "@analyzer/WorkspaceFileRetriever";
import { Logger } from "@utils/Logger";
import { Telemetry } from "./telemetry/types";
import { ServerState } from "./types";
import { onHover } from "./services/hover/onHover";
import { onInitialize } from "./services/initialization/onInitialize";
import { onInitialized } from "./services/initialization/onInitialized";

const debounceAnalyzeDocument: {
  [uri: string]: (
    documents: TextDocuments<TextDocument>,
    uri: string,
    languageServer: LanguageService,
    logger: Logger
  ) => void;
} = {};

const debounceValidateDocument: {
  [uri: string]: (
    validationJob: ValidationJob,
    connection: Connection,
    uri: string,
    document: TextDocument,
    logger: Logger
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
  compProcessFactory: typeof compilerProcessFactory,
  workspaceFileRetriever: WorkspaceFileRetriever,
  telemetry: Telemetry,
  logger: Logger
): ServerState {
  const em = new events.EventEmitter();

  const serverState: ServerState = {
    env: "production",
    hasWorkspaceFolderCapability: false,
    globalTelemetryEnabled: false,
    hardhatTelemetryEnabled: false,

    connection,
    documents: new TextDocuments(TextDocument),
    workspaceFolders: [],
    em,
    languageServer: new LanguageService(
      compProcessFactory,
      workspaceFileRetriever,
      em,
      logger
    ),
    telemetry,
    logger,
  };

  connection.onInitialize(onInitialize(serverState));

  connection.onInitialized(onInitialized(serverState));

  connection.onSignatureHelp(
    (params: SignatureHelpParams): SignatureHelp | undefined => {
      const { logger } = serverState;

      logger.trace("onSignatureHelp");

      try {
        const document = serverState.documents.get(params.textDocument.uri);

        if (document) {
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
            return serverState.telemetry.trackTimingSync(
              "onSignatureHelp",
              () =>
                serverState.languageServer.soliditySignatureHelp.doSignatureHelp(
                  document,
                  params.position,
                  documentAnalyzer
                )
            );
          }
        }
      } catch (err) {
        logger.error(err);
      }
    }
  );

  connection.onCompletion(
    (params: CompletionParams): CompletionList | undefined => {
      const { logger } = serverState;

      logger.trace("onCompletion");

      try {
        const document = serverState.documents.get(params.textDocument.uri);

        if (document) {
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

          if (!documentAnalyzer) {
            return;
          }

          return serverState.telemetry.trackTimingSync("onCompletion", () =>
            serverState.languageServer.solidityCompletion.doComplete(
              params.position,
              documentAnalyzer,
              params.context,
              logger
            )
          );
        }
      } catch (err) {
        logger.error(err);
      }
    }
  );

  connection.onDefinition((params) => {
    const { logger } = serverState;

    logger.trace("onDefinition");

    try {
      const document = serverState.documents.get(params.textDocument.uri);

      if (document) {
        const documentURI = getUriFromDocument(document);
        const documentAnalyzer =
          serverState.languageServer.analyzer.getDocumentAnalyzer(documentURI);

        if (documentAnalyzer.isAnalyzed) {
          return serverState.telemetry.trackTimingSync("onDefinition", () =>
            serverState.languageServer.solidityNavigation.findDefinition(
              documentURI,
              params.position,
              documentAnalyzer.analyzerTree.tree
            )
          );
        }
      }
    } catch (err) {
      logger.error(err);
    }
  });

  connection.onTypeDefinition((params) => {
    const { logger } = serverState;

    logger.trace("onTypeDefinition");

    try {
      const document = serverState.documents.get(params.textDocument.uri);

      if (document) {
        const documentURI = getUriFromDocument(document);
        const documentAnalyzer =
          serverState.languageServer.analyzer.getDocumentAnalyzer(documentURI);

        if (documentAnalyzer.isAnalyzed) {
          return serverState.telemetry.trackTimingSync(
            "onTypeDefinition",
            () => {
              return serverState.languageServer.solidityNavigation.findTypeDefinition(
                documentURI,
                params.position,
                documentAnalyzer.analyzerTree.tree
              );
            }
          );
        }
      }
    } catch (err) {
      logger.error(err);
    }
  });

  connection.onReferences((params) => {
    const { logger } = serverState;

    logger.trace("onReferences");

    try {
      const document = serverState.documents.get(params.textDocument.uri);

      if (document) {
        const documentURI = getUriFromDocument(document);
        const documentAnalyzer =
          serverState.languageServer.analyzer.getDocumentAnalyzer(documentURI);

        if (documentAnalyzer.isAnalyzed) {
          return serverState.telemetry.trackTimingSync("onReferences", () =>
            serverState.languageServer.solidityNavigation.findReferences(
              documentURI,
              params.position,
              documentAnalyzer.analyzerTree.tree
            )
          );
        }
      }
    } catch (err) {
      logger.error(err);
    }
  });

  connection.onImplementation((params) => {
    const { logger } = serverState;

    logger.trace("onImplementation");

    try {
      const document = serverState.documents.get(params.textDocument.uri);

      if (document) {
        const documentURI = getUriFromDocument(document);
        const documentAnalyzer =
          serverState.languageServer.analyzer.getDocumentAnalyzer(documentURI);

        if (documentAnalyzer.isAnalyzed) {
          return serverState.telemetry.trackTimingSync("onImplementation", () =>
            serverState.languageServer.solidityNavigation.findImplementation(
              documentURI,
              params.position,
              documentAnalyzer.analyzerTree.tree
            )
          );
        }
      }
    } catch (err) {
      logger.error(err);
    }
  });

  connection.onRenameRequest((params) => {
    const { logger } = serverState;

    logger.trace("onRenameRequest");

    try {
      const document = serverState.documents.get(params.textDocument.uri);

      if (document) {
        const documentURI = getUriFromDocument(document);
        const documentAnalyzer =
          serverState.languageServer.analyzer.getDocumentAnalyzer(documentURI);

        if (documentAnalyzer.isAnalyzed) {
          return serverState.telemetry.trackTimingSync("onRenameRequest", () =>
            serverState.languageServer.solidityRename.doRename(
              documentURI,
              params.position,
              params.newName,
              documentAnalyzer.analyzerTree.tree
            )
          );
        }
      }
    } catch (err) {
      logger.error(err);
    }
  });

  connection.onCodeAction(onCodeAction(serverState));

  connection.onHover(onHover(serverState));

  telemetry.enableHeartbeat();

  connection.onExit(() => {
    logger.info("Server closing down");
    return telemetry.close();
  });

  connection.onNotification(
    "custom/didChangeGlobalTelemetryEnabled",
    ({ enabled }: { enabled: boolean }) => {
      if (enabled) {
        logger.info(`Global telemetry enabled`);
      } else {
        logger.info(`Global telemetry disabled`);
      }

      serverState.globalTelemetryEnabled = enabled;
    }
  );

  connection.onNotification(
    "custom/didChangeHardhatTelemetryEnabled",
    ({ enabled }: { enabled: boolean }) => {
      if (enabled) {
        logger.info(`Hardhat telemetry enabled`);
      } else {
        logger.info(`Hardhat telemetry disabled`);
      }

      serverState.hardhatTelemetryEnabled = enabled;
    }
  );

  // The content of a text document has changed. This event is emitted
  // when the text document first opened or when its content has changed.
  serverState.documents.onDidChangeContent((change) => {
    const { logger } = serverState;

    logger.trace("onDidChangeContent");

    try {
      if (
        !serverState.languageServer ||
        !serverState.languageServer.solidityValidation
      ) {
        return;
      }

      if (!debounceAnalyzeDocument[change.document.uri]) {
        debounceAnalyzeDocument[change.document.uri] = debounce(
          analyzeFunc,
          500
        );
      }

      debounceAnalyzeDocument[change.document.uri](
        serverState.documents,
        change.document.uri,
        serverState.languageServer,
        serverState.logger
      );

      // ------------------------------------------------------------------------

      if (!debounceValidateDocument[change.document.uri]) {
        debounceValidateDocument[change.document.uri] = debounce(
          validateTextDocument,
          500
        );
      }

      const documentURI = getUriFromDocument(change.document);
      const validationJob =
        serverState.languageServer.solidityValidation.getValidationJob(
          telemetry,
          logger
        );

      debounceValidateDocument[change.document.uri](
        validationJob,
        connection,
        documentURI,
        change.document,
        logger
      );
    } catch (err) {
      logger.error(err);
    }
  });

  // Make the text document manager listen on the connection
  // for open, change and close text document events
  serverState.documents.listen(connection);

  serverState.em.on("indexing-file", (data: IndexFileData) => {
    connection.sendNotification("custom/indexing-file", data);
  });

  return serverState;
}

function analyzeFunc(
  documents: TextDocuments<TextDocument>,
  uri: string,
  languageServer: LanguageService,
  logger: Logger
): void {
  logger.trace("debounced onDidChangeContent");

  try {
    const document = documents.get(uri);

    if (document) {
      const documentURI = getUriFromDocument(document);
      languageServer.analyzer.analyzeDocument(document.getText(), documentURI);
    }
  } catch (err) {
    logger.error(err);
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
  validationJob: ValidationJob,
  connection: Connection,
  uri: string,
  document: TextDocument,
  logger: Logger
): Promise<void> {
  logger.trace("validateTextDocument");

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

    connection.sendDiagnostics({
      uri: document.uri,
      diagnostics: [],
    });
  } catch (err) {
    logger.error(err);
  }
}
