import { TextDocument } from "vscode-languageserver-textdocument";
import { TextEdit } from "vscode-languageserver-types";
import { PrettyPrinter } from "../../utils/PrettyPrinter";

export async function prettierFormat(text: string, document: TextDocument) {
  const formattedText = await new PrettyPrinter().format(text, { document });

  const textEdit: TextEdit = {
    range: {
      start: { line: 0, character: 0 },
      end: document.positionAt(text.length),
    },
    newText: formattedText,
  };

  return [textEdit];
}
