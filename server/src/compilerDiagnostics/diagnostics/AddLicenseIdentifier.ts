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

const LICENSE_STATEMENT = "// SPDX-License-Identifier: $LICENSE";
export const LICENSES = [
  "MIT",
  "GPL-2.0-or-later",
  "GPL-3.0-or-later",
  "Unlicense",
];

/**
 * This diagnostic is shown when license identifier is not provided
 * i.e. SPDX-License-Identifier: MIT;
 *
 * The suggested quickfix adds a license identifier on top of the file
 */
export class AddLicenseIdentifier implements CompilerDiagnostic {
  public code = "1878";
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
    { uri }: ResolveActionsContext
  ): CodeAction[] {
    const position = { character: 0, line: 0 };

    return LICENSES.map((license) => ({
      title: `Add license identifier: ${license}`,
      kind: CodeActionKind.QuickFix,
      isPreferred: false,

      edit: {
        changes: {
          [uri]: [
            {
              range: Range.create(position, position),
              newText: `${LICENSE_STATEMENT.replace("$LICENSE", license)}\n`,
            },
          ],
        },
      },
    }));
  }
}
