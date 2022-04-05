import * as events from "events";
import { Connection } from "vscode-languageserver";
import { TextDocuments } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { IndexFileData } from "@common/event";
import { getUriFromDocument } from "./utils";
import { debounce } from "./utils/debaunce";
import { LanguageService } from "./parser";
import { Logger } from "@utils/Logger";
import { Telemetry } from "./telemetry/types";
import { ServerState } from "./types";
import { WorkspaceFileRetriever } from "@analyzer/WorkspaceFileRetriever";
import { onHover } from "@services/hover/onHover";
import { onInitialize } from "@services/initialization/onInitialize";
import { onInitialized } from "@services/initialization/onInitialized";
import { onSignatureHelp } from "@services/signaturehelp/onSignatureHelp";
import { onCompletion } from "@services/completion/onCompletion";
import { onCodeAction } from "@services/codeactions/onCodeAction";
import { ValidationJob } from "@services/validation/SolidityValidation";
import { compilerProcessFactory } from "@services/validation/compilerProcessFactory";
import { onDefinition } from "@services/definition/onDefinition";
import { onTypeDefinition } from "@services/typeDefinition/onTypeDefinition";
import { onReferences } from "@services/references/onReferences";
import { onImplementation } from "@services/implementation/onImplementation";
import { onRename } from "@services/rename/onRename";

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

  connection.onSignatureHelp(onSignatureHelp(serverState));

  connection.onCompletion(onCompletion(serverState));

  connection.onDefinition(onDefinition(serverState));

  connection.onTypeDefinition(onTypeDefinition(serverState));

  connection.onReferences(onReferences(serverState));

  connection.onImplementation(onImplementation(serverState));

  connection.onRenameRequest(onRename(serverState));

  connection.onCodeAction(onCodeAction(serverState));

  connection.onHover(onHover(serverState));

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

  connection.onExit(() => {
    logger.info("Server closing down");
    return telemetry.close();
  });

  telemetry.enableHeartbeat();

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
