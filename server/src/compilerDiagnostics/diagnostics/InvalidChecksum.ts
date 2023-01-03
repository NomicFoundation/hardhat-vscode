import {
  CodeAction,
  CodeActionKind,
  Diagnostic,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { ResolveActionsContext } from "../types";
import { SolcError, ServerState } from "../../types";
import { passThroughConversion } from "../conversions/passThroughConversion";

export class InvalidChecksum {
  public code = "9429";

  public fromHardhatCompilerError(
    document: TextDocument,
    error: SolcError
  ): Diagnostic {
    return passThroughConversion(document, error);
  }

  public resolveActions(
    _serverState: ServerState,
    diagnostic: Diagnostic,
    context: ResolveActionsContext
  ): CodeAction[] {
    const { uri } = context;

    const checksummedRegex = /checksummed address: "(\w*)"/;

    const match = diagnostic.message.match(checksummedRegex);

    if (match === null || match[1] === undefined) {
      return [];
    }

    const checksummedAddress = match[1];

    return [
      {
        title: `Convert to checksummed address`,
        kind: CodeActionKind.QuickFix,
        isPreferred: true,

        edit: {
          changes: {
            [uri]: [
              {
                range: diagnostic.range,
                newText: checksummedAddress,
              },
            ],
          },
        },
      },
    ];
  }
}
