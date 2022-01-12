import {
  CodeAction,
  CodeActionKind,
  Diagnostic,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { CodeActionResolver } from "../types";

const constrainMutability: CodeActionResolver = (
  diagnostic: Diagnostic,
  { document, uri }: { document: TextDocument; uri: string }
): CodeAction[] => {
  const constrainMutability = diagnostic;

  const modifier = constrainMutability.message.includes("pure")
    ? "pure"
    : "view";

  const constrainMutabilityRange = constrainMutability.range;

  const functionLine = document.getText({
    start: {
      line: constrainMutabilityRange.start.line,
      character: 0,
    },
    end: {
      line: constrainMutabilityRange.start.line + 1,
      character: 0,
    },
  });

  let startChar,
    endChar = 0;

  let index = functionLine.indexOf("view");

  if (index >= 0) {
    startChar = index;
    endChar = index + 5;
  } else {
    index = functionLine.indexOf("returns");

    if (index < 0) {
      return [];
    }

    startChar = index;
    endChar = index;
  }

  const action: CodeAction = {
    title: `Add ${modifier} modifier`,
    kind: CodeActionKind.QuickFix,
    isPreferred: true,
    edit: {
      changes: {
        [uri]: [
          {
            range: {
              start: {
                line: constrainMutabilityRange.start.line,
                character: startChar,
              },
              end: {
                line: constrainMutabilityRange.start.line,
                character: endChar,
              },
            },
            newText: `${modifier} `,
          },
        ],
      },
    },
  };

  return [action];
};

export { constrainMutability };
