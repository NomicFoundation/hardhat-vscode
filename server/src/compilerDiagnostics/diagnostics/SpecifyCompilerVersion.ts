import { TextDocument } from "vscode-languageserver-textdocument";
import {
  CodeAction,
  CodeActionKind,
  Diagnostic,
  Range,
} from "vscode-languageserver/node";
import { CompilerDiagnostic, ResolveActionsContext } from "../types";
import { SolcError, ServerState } from "../../types";
import { passThroughConversion } from "../conversions/passThroughConversion";

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
    error: SolcError
  ): Diagnostic {
    return passThroughConversion(document, error);
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

    // If first line is license specifier, insert pragma statement after it
    // Otherwise it is inserted on the first line
    const position = { character: 0, line: 0 };

    if (/^\/\/\s*SPDX-License-Identifier:/.test(document.getText())) {
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
