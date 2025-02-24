import { TextDocument } from "vscode-languageserver-textdocument";
import { TextEdit } from "vscode-languageserver-types";
import * as sentry from "@sentry/node";
import { PrettyPrinter2 } from "../../utils/prettier2/PrettyPrinter2";
import { PrettyPrinter3 } from "../../utils/prettier3/PrettyPrinter3";

const PRETTIER_3_SAMPLE_RATE = 0.01;

export async function prettierFormat(text: string, document: TextDocument) {
  const printer = new PrettyPrinter2();
  const formattedText = await printer.format(text, { document });

  if (Math.random() < PRETTIER_3_SAMPLE_RATE) {
    const printer3 = new PrettyPrinter3();
    try {
      await printer3.format(text, { document });
    } catch (error) {
      // we call sentry directly instead of via serverState.telemetry to avoid passing it all the way down here
      // this is temporary
      sentry.captureException(error);
    }
  }

  const textEdit: TextEdit = {
    range: {
      start: { line: 0, character: 0 },
      end: document.positionAt(text.length),
    },
    newText: formattedText,
  };

  return [textEdit];
}
