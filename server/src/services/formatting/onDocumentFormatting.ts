import { DocumentFormattingParams } from "vscode-languageserver/node";
import { TextEdit } from "vscode-languageserver-types";
import { ServerState } from "../../types";
import { prettierFormat } from "./prettierFormat";
import { forgeFormat } from "./forgeFormat";

export function onDocumentFormatting(serverState: ServerState) {
  return async (
    params: DocumentFormattingParams
  ): Promise<TextEdit[] | null> => {
    const { formatter } = serverState.extensionConfig;
    const uri = params.textDocument.uri;
    const document = serverState.documents.get(uri);

    if (document === undefined) {
      serverState.logger.error(`Failed to format, uri ${uri} not indexed`);

      return null;
    }

    const text = document.getText();

    try {
      switch (formatter) {
        case "forge":
          return await forgeFormat(text, document);

        case "prettier":
          return prettierFormat(text, document);

        default:
          return null;
      }
    } catch (error) {
      serverState.logger.error(
        `Error formatting document ${uri} with ${formatter}`
      );
      return null;
    }
  };
}
