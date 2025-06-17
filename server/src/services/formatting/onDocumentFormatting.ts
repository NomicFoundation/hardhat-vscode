import { DocumentFormattingParams } from "vscode-languageserver/node";
import { TextEdit } from "vscode-languageserver-types";
import { TextDocument } from "vscode-languageserver-textdocument";
import { Logger } from "@utils/Logger";
import { setTag, startSpan } from "@sentry/core";
import { ServerState } from "../../types";
import { TrackingResult } from "../../telemetry/types";
import { ForgeResolveError, TimeoutError } from "../../utils/errors";
import {
  DEADLINE_EXCEEDED,
  FAILED_PRECONDITION,
  INTERNAL_ERROR,
  INVALID_ARGUMENT,
  OK,
} from "../../telemetry/TelemetryStatus";
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
      async (): Promise<TrackingResult<OnDocumentFormattingResult>> => {
        const formatter = serverState.extensionConfig.formatter ?? "prettier";
        const uri = params.textDocument.uri;
        const document = serverState.documents.get(uri);

        if (document === undefined) {
          logger.error(`Failed to format, uri ${uri} not indexed`);

          return { status: INTERNAL_ERROR, result: null };
        }

        logger.trace(`Formatter: ${formatter}`);

        const text = document.getText();

        try {
          switch (formatter) {
            case "forge":
              return await runForgeFormat(text, document, logger);

            case "prettier":
              return runPrettierFormat(text, document);

            default:
              return { status: INVALID_ARGUMENT, result: null };
          }
        } catch (error) {
          serverState.logger.info(
            `Error formatting document ${uri} with ${formatter}: ${error}`
          );

          if (error instanceof TimeoutError) {
            return { status: DEADLINE_EXCEEDED, result: null };
          } else if (error instanceof ForgeResolveError) {
            return { status: FAILED_PRECONDITION, result: null };
          } else {
            return { status: INTERNAL_ERROR, result: null };
          }
        }
      }
    );
  };
}

async function runForgeFormat(
  text: string,
  document: TextDocument,
  logger: Logger
): Promise<TrackingResult<OnDocumentFormattingResult>> {
  setTag("formatter", "forge");
  const result = await startSpan({ name: "forge-format" }, () =>
    forgeFormat(text, document, logger)
  );

  return { status: OK, result };
}

function runPrettierFormat(
  text: string,
  document: TextDocument
): TrackingResult<OnDocumentFormattingResult> {
  setTag("formatter", "prettier");

  const result = startSpan({ name: "prettier-format" }, () =>
    prettierFormat(text, document)
  );

  return { status: OK, result };
}
