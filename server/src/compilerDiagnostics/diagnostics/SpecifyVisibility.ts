import {
  CodeAction,
  CodeActionKind,
  Diagnostic,
  Range,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { HardhatCompilerError } from "../types";
import { attemptConstrainToFunctionName } from "../conversions/attemptConstrainToFunctionName";

export class SpecifyVisibility {
  public code = "4937";

  fromHardhatCompilerError(
    document: TextDocument,
    error: HardhatCompilerError
  ): Diagnostic {
    return attemptConstrainToFunctionName(document, error);
  }

  resolveActions(
    diagnostic: Diagnostic,
    { document, uri }: { document: TextDocument; uri: string }
  ): CodeAction[] {
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

    const index = functionLine.indexOf(")");

    if (index < 0) {
      return [];
    }

    const startChar = index + 1;

    const addPublic = this.constructVisibilityCodeActionFor(
      "public",
      startChar,
      functionLine,
      uri,
      range
    );

    const addPrivate = this.constructVisibilityCodeActionFor(
      "private",
      startChar,
      functionLine,
      uri,
      range
    );

    return [addPublic, addPrivate];
  }

  private constructVisibilityCodeActionFor(
    visibility: "public" | "private" | "external" | "internal",
    startChar: number,
    functionLine: string,
    uri: string,
    range: Range
  ): CodeAction {
    const newText =
      functionLine[startChar] === " " ? ` ${visibility}` : ` ${visibility} `;

    return {
      title: `Add ${visibility} visibilty to function declaration`,
      kind: CodeActionKind.QuickFix,
      isPreferred: false,
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
                  character: startChar,
                },
              },
              newText,
            },
          ],
        },
      },
    };
  }
}
