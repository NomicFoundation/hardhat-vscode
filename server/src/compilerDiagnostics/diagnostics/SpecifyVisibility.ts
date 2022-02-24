import {
  CodeAction,
  CodeActionKind,
  Diagnostic,
  Range,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { HardhatCompilerError, ResolveActionsContext } from "../types";
import { attemptConstrainToFunctionName } from "../conversions/attemptConstrainToFunctionName";
import { parseFunctionDefinition } from "./parsing/parseFunctionDefinition";
import { lookupToken } from "./parsing/lookupToken";

type Visibility = "public" | "private" | "external" | "internal";

const QUICK_FIX_VISIBILITIES: Visibility[] = ["public", "private"];

export class SpecifyVisibility {
  public code = "4937";
  public blocks: string[] = [];

  fromHardhatCompilerError(
    document: TextDocument,
    error: HardhatCompilerError
  ): Diagnostic {
    return attemptConstrainToFunctionName(document, error);
  }

  resolveActions(
    diagnostic: Diagnostic,
    context: ResolveActionsContext
  ): CodeAction[] {
    const { document, uri } = context;

    const parseResult = parseFunctionDefinition(diagnostic, context);

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

    return QUICK_FIX_VISIBILITIES.map((visibility) =>
      this.constructVisibilityCodeActionFor(
        visibility,
        document,
        uri,
        startChar
      )
    );
  }

  private constructVisibilityCodeActionFor(
    visibility: Visibility,
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
