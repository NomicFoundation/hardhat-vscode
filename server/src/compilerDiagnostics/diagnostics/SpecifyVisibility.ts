import {
  CodeAction,
  CodeActionKind,
  Diagnostic,
  Range,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { HardhatCompilerError } from "../types";
import { attemptConstrainToFunctionName } from "../conversions/attemptConstrainToFunctionName";
import { parseFunctionDefinition } from "./parsing/parseFunctionDefinition";
import { lookupToken } from "./parsing/lookupToken";

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
    const parseResult = parseFunctionDefinition(diagnostic, document);

    if (parseResult === null) {
      return [];
    }

    const { tokens, functionSourceLocation } = parseResult;

    const lookupResult = lookupToken(
      tokens,
      document,
      functionSourceLocation,
      (t) => t.type === "Punctuator" && t.value === ")"
    );

    if (lookupResult === null) {
      return [];
    }

    const { token: closingParamListToken } = lookupResult;

    if (closingParamListToken.range === undefined) {
      return [];
    }

    const startChar =
      functionSourceLocation.start + closingParamListToken.range[0] + 1;

    const addPublic = this.constructVisibilityCodeActionFor(
      "public",
      document,
      uri,
      startChar
    );

    const addPrivate = this.constructVisibilityCodeActionFor(
      "private",
      document,
      uri,
      startChar
    );

    return [addPublic, addPrivate];
  }

  private constructVisibilityCodeActionFor(
    visibility: "public" | "private" | "external" | "internal",
    document: TextDocument,
    uri: string,
    startChar: number
  ): CodeAction {
    const newText =
      document.getText(
        Range.create(
          document.positionAt(startChar + 0),
          document.positionAt(startChar + 1)
        )
      ) === " "
        ? ` ${visibility}`
        : ` ${visibility} `;

    return {
      title: `Add ${visibility} visibilty to function declaration`,
      kind: CodeActionKind.QuickFix,
      isPreferred: false,
      edit: {
        changes: {
          [uri]: [
            {
              range: Range.create(
                document.positionAt(startChar),
                document.positionAt(startChar)
              ),
              newText,
            },
          ],
        },
      },
    };
  }
}
