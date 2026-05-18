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
import { parseFunctionDefinitionAuto } from "./parsing/parseFunctionDefinition";
import { lookupCursor } from "./parsing/lookupToken";

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

  public async resolveActions(
    serverState: ServerState,
    diagnostic: Diagnostic,
    context: ResolveActionsContext
  ): Promise<CodeAction[]> {
    const { document, uri } = context;

    const parseResult = await parseFunctionDefinitionAuto(
      serverState,
      diagnostic,
      document
    );

    if (parseResult === null) {
      return [];
    }

    const { cursors, functionSourceLocation } = parseResult;
    const { TerminalKind } = await import("@nomicfoundation/slang/cst");

    const lookupResult = lookupCursor(
      cursors,
      document,
      functionSourceLocation,
      (c) => c.node.isTerminalNode() && c.node.kind === TerminalKind.CloseParen
    );

    if (lookupResult === null) {
      return [];
    }

    const startChar =
      functionSourceLocation.start + lookupResult.cursor.textRange.start.utf8 + 1;

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
      title: `Add ${visibility} visibility to function declaration`,
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
