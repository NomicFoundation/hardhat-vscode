import { DocumentFormattingParams } from "vscode-languageserver/node";
import { TextEdit } from "vscode-languageserver-types";
import { TextDocument } from "vscode-languageserver-textdocument";
import { Logger } from "@utils/Logger";
import { Transaction } from "@sentry/types";
import { ServerState } from "../../types";
import { TrackingResult } from "../../telemetry/types";
import { prettierFormat } from "./prettierFormat";
import { forgeFormat } from "./forgeFormat";

type OnDocumentFormattingResult = TextEdit[] | null;

export function onDocumentFormatting(serverState: ServerState) {
  return async (
    params: DocumentFormattingParams
  ): Promise<OnDocumentFormattingResult> => {
    const { telemetry, logger } = serverState;
    return telemetry.trackTiming(
      "onDocumentFormatting",
      async (
        transaction
      ): Promise<TrackingResult<OnDocumentFormattingResult>> => {
        const formatter = serverState.extensionConfig.formatter ?? "prettier";
        const uri = params.textDocument.uri;
        const document = serverState.documents.get(uri);

        if (document === undefined) {
          logger.error(`Failed to format, uri ${uri} not indexed`);

          return { status: "internal_error", result: null };
        }

        logger.trace(`Formatter: ${formatter}`);

        const text = document.getText();

        try {
          switch (formatter) {
            case "forge":
              return await runForgeFormat(text, document, logger, transaction);

            case "prettier":
              return await runPrettierFormat(text, document, transaction);

            default:
              return { status: "invalid_argument", result: null };
          }
        } catch (error) {
          serverState.logger.trace(
            `Error formatting document ${uri} with ${formatter}: ${error}`
          );

          return { status: "internal_error", result: null };
        }
      }
    );
  };
}

async function runForgeFormat(
  text: string,
  document: TextDocument,
  logger: Logger,
  transaction: Transaction
): Promise<TrackingResult<OnDocumentFormattingResult>> {
  transaction.setTag("formatter", "forge");
  const span = transaction.startChild({ op: "forge-format" });

  const result = await forgeFormat(text, document, logger);

  span.finish();

  return { status: "ok", result };
}

async function runPrettierFormat(
  text: string,
  document: TextDocument,
  transaction: Transaction
): Promise<TrackingResult<OnDocumentFormattingResult>> {
  const span = transaction.startChild({ op: "prettier-format" });

  const result = await prettierFormat(text, document);

  span.finish();

  return { status: "ok", result };
}
