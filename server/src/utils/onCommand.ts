import { ISolFileEntry } from "@common/types";
import { TextDocument } from "vscode-languageserver-textdocument";
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

  return telemetry.trackTimingSync(commandName, () => {
    const { found, errorMessage, documentAnalyzer, document } =
      lookupEntryForUri(serverState, uri);

    if (!found || !documentAnalyzer || !document) {
      logger.error(
        new Error(`Error analyzing doc within ${commandName}: ${errorMessage}`)
      );

      return null;
    }

    return action(documentAnalyzer, document);
  });
}
