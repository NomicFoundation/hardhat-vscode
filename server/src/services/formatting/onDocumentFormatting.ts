import { DocumentFormattingParams } from "vscode-languageserver/node";
import { TextEdit } from "vscode-languageserver-types";
import { ServerState } from "../../types";
import { prettierFormat } from "./prettierFormat";
import { forgeFormat } from "./forgeFormat";

export function onDocumentFormatting(serverState: ServerState) {
  return async (
    params: DocumentFormattingParams
  ): Promise<TextEdit[] | null> => {
    const { logger } = serverState;

    const formatter = serverState.extensionConfig.formatter ?? "prettier";
    const uri = params.textDocument.uri;
    const document = serverState.documents.get(uri);

    if (document === undefined) {
      logger.error(`Failed to format, uri ${uri} not indexed`);

      return null;
    }

    logger.trace(`Formatter: ${formatter}`);

    const text = document.getText();

    try {
      switch (formatter) {
        case "forge":
          return await forgeFormat(text, document, logger);

        case "prettier":
          return prettierFormat(text, document);

        default:
          return null;
      }
    } catch (error) {
      serverState.logger.info(
        `Error formatting document ${uri} with ${formatter}: ${error}`
      );

      return null;
    }
  };
}
