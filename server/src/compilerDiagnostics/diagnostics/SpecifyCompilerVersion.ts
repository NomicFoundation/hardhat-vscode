import { TextDocument } from "vscode-languageserver-textdocument";
import {
  CodeAction,
  CodeActionKind,
  Diagnostic,
  Range,
} from "vscode-languageserver/node";
import { CompilerDiagnostic, ResolveActionsContext } from "../types";
import { attemptConstrainToFunctionName } from "../conversions/attemptConstrainToFunctionName";
import { HardhatCompilerError, ServerState } from "../../types";

/**
 * This diagnostic is shown when no compiler version is specified
 * i.e. pragma solidity XXXX;
 *
 * The suggested quickfix adds the pragma solidity statement, by
 * extracting the version from hardhat's warning message.
 */
export class SpecifyCompilerVersion implements CompilerDiagnostic {
  public code = "3420";
  public blocks: string[] = [];

  public fromHardhatCompilerError(
    document: TextDocument,
    error: HardhatCompilerError
  ): Diagnostic {
    return attemptConstrainToFunctionName(document, error);
  }

  public resolveActions(
    _serverState: ServerState,
    _diagnostic: Diagnostic,
    { uri, document }: ResolveActionsContext
  ): CodeAction[] {
    // Get the compiler specification code from hardhat warning
    const regex = /pragma solidity .*;/;
    const match = _diagnostic.message.match(regex);
    const pragmaLine = match && match[0];

    if (pragmaLine === null) {
      return [];
    }

    // If diagnostic is shown on "// SPDX ..." line, insert on next line.
    // Otherwise insert on previous line
    const position = { character: 0, line: _diagnostic.range.end.line };

    const checkRange: Range = {
      start: _diagnostic.range.start,
      end: {
        line: _diagnostic.range.end.line,
        character: _diagnostic.range.end.character + 1,
      },
    };

    if (document.getText(checkRange) === "/") {
      position.line += 1;
    }

    return [
      {
        title: "Add version specification",
        kind: CodeActionKind.QuickFix,
        isPreferred: true,
        edit: {
          changes: {
            [uri]: [
              {
                range: Range.create(position, position),
                newText: `${pragmaLine}\n`,
              },
            ],
          },
        },
      },
    ];
  }
}
