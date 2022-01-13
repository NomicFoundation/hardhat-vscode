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
  const modifier = diagnostic.message.includes("pure") ? "pure" : "view";

  const range = diagnostic.range;

  const functionLine = document.getText({
    start: {
      line: range.start.line,
      character: 0,
    },
    end: {
      line: range.start.line + 1,
      character: 0,
    },
  });

  let startChar,
    endChar = 0;
  let title: string;

  let index = functionLine.indexOf("view");

  if (index >= 0) {
    startChar = index;
    endChar = index + 5;
    title = "Change view modifier to pure";
  } else {
    index = functionLine.indexOf("returns");

    if (index < 0) {
      return [];
    }

    startChar = index;
    endChar = index;
    title = `Add ${modifier} modifier`;
  }

  const action: CodeAction = {
    title: title,
    kind: CodeActionKind.QuickFix,
    isPreferred: true,
    edit: {
      changes: {
        [uri]: [
          {
            range: {
              start: {
                line: range.start.line,
                character: startChar,
              },
              end: {
                line: range.start.line,
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
