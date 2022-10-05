import {
  CodeAction,
  CodeActionKind,
  Diagnostic,
  Range,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { ResolveActionsContext } from "../types";
import { attemptConstrainToFunctionName } from "../conversions/attemptConstrainToFunctionName";
import { SolcError, ServerState } from "../../types";
import { parseFunctionDefinition } from "./parsing/parseFunctionDefinition";
import { lookupToken } from "./parsing/lookupToken";

type Visibility = "public" | "private" | "external" | "internal";

const QUICK_FIX_VISIBILITIES: Visibility[] = ["public", "private"];

export class SpecifyVisibility {
  public code = "4937";
  public blocks: string[] = [];

  public fromHardhatCompilerError(
    document: TextDocument,
    error: SolcError
  ): Diagnostic {
    return attemptConstrainToFunctionName(document, error);
  }

  public resolveActions(
    serverState: ServerState,
    diagnostic: Diagnostic,
    context: ResolveActionsContext
  ): CodeAction[] {
    const { document, uri } = context;

    const parseResult = parseFunctionDefinition(
      diagnostic,
      document,
      serverState.logger
    );

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
      this._constructVisibilityCodeActionFor(
        visibility,
        document,
        uri,
        startChar
      )
    );
  }

  private _constructVisibilityCodeActionFor(
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
