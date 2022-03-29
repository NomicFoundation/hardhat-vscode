import { languages, ExtensionContext, TextDocument, TextEdit } from "vscode";
import { formatDocument } from "../formatter";
import { Logger } from "../utils/Logger";

export function setupFormatterHook({
  context,
  logger,
}: {
  context: ExtensionContext;
  logger: Logger;
}) {
  context.subscriptions.push(
    languages.registerDocumentFormattingEditProvider("solidity", {
      provideDocumentFormattingEdits(document: TextDocument): TextEdit[] {
        try {
          return formatDocument(document, context);
        } catch (err: unknown) {
          logger.error(err);
          return [];
        }
      },
    })
  );
}
