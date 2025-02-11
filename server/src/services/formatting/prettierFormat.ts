import { TextDocument } from "vscode-languageserver-textdocument";
import { TextEdit } from "vscode-languageserver-types";
import { PrettyPrinter2 } from "../../utils/prettier2/PrettyPrinter2";
import { PrettyPrinter3 } from "../../utils/prettier3/PrettyPrinter3";

export async function prettierFormat(
  text: string,
  document: TextDocument,
  version = "prettier2"
) {
  const formatters = {
    prettier2: new PrettyPrinter2(),
    prettier3: new PrettyPrinter3(),
  };

  if (version !== "prettier2" && version !== "prettier3") {
    throw new Error(`Invalid prettier version: ${version}`);
  }

  const printer = formatters[version];
  const formattedText = await printer.format(text, { document });

  const textEdit: TextEdit = {
    range: {
      start: { line: 0, character: 0 },
      end: document.positionAt(text.length),
    },
    newText: formattedText,
  };

  return [textEdit];
}
