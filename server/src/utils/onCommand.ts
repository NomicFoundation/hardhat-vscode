import { ISolFileEntry } from "@common/types";
import { TextDocument } from "vscode-languageserver-textdocument";
import { addFrameworkTag } from "../telemetry/tags";
import { ServerState } from "../types";
import { lookupEntryForUri } from "./lookupEntryForUri";

export function onCommand<T>(
  serverState: ServerState,
  commandName: string,
  uri: string,
  action: (documentAnalyzer: ISolFileEntry, document: TextDocument) => T
) {
  const { logger, telemetry } = serverState;

  logger.trace(commandName);

  return telemetry.trackTimingSync(commandName, (transaction) => {
    const { found, errorMessage, documentAnalyzer, document } =
      lookupEntryForUri(serverState, uri);

    if (!found || !documentAnalyzer || !document) {
      if (errorMessage !== undefined) {
        logger.trace(errorMessage);
      }

      return { status: "failed_precondition", result: null };
    }

    addFrameworkTag(transaction, documentAnalyzer.project);

    return { status: "ok", result: action(documentAnalyzer, document) };
  });
}
