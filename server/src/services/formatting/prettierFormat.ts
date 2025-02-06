import { TextDocument } from "vscode-languageserver-textdocument";
import { TextEdit } from "vscode-languageserver-types";
import { PrettyPrinter2 } from "../../utils/prettier2/PrettyPrinter2";

export async function prettierFormat(text: string, document: TextDocument) {
  const formattedText = await new PrettyPrinter2().format(text, { document });

  const textEdit: TextEdit = {
    range: {
      start: { line: 0, character: 0 },
      end: document.positionAt(text.length),
    },
    newText: formattedText,
  };

  return [textEdit];
}
