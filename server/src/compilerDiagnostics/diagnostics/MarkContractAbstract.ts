import {
  CodeAction,
  CodeActionKind,
  Diagnostic,
  Range,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { attemptConstrainToContractName } from "@compilerDiagnostics/conversions/attemptConstrainToContractName";
import { ResolveActionsContext } from "../types";
import { SolcError, ServerState } from "../../types";
import {
  parseContractDefinition,
  ParseContractDefinitionResult,
} from "./parsing/parseContractDefinition";
import { buildImplementInterfaceQuickFix } from "./common/ImplementInterface/buildImplementInterfaceQuickFix";

export class MarkContractAbstract {
  public code = "3656";
  public blocks = [];

  public fromHardhatCompilerError(
    document: TextDocument,
    error: SolcError
  ): Diagnostic {
    return attemptConstrainToContractName(document, error);
  }

  public resolveActions(
    serverState: ServerState,
    diagnostic: Diagnostic,
    context: ResolveActionsContext
  ): CodeAction[] {
    const parseResult = parseContractDefinition(
      diagnostic,
      context,
      serverState.logger
    );

    if (parseResult === null) {
      return [];
    }

    const implementInterfaceQuickFix = buildImplementInterfaceQuickFix(
      serverState,
      parseResult,
      context
    );

    const addAbstrackQuickFix = this._buildAddAbstractQuickFix(
      parseResult,
      context
    );

    return [implementInterfaceQuickFix, addAbstrackQuickFix].filter(
      (act): act is CodeAction => act !== null
    );
  }

  private _buildAddAbstractQuickFix(
    { tokens, functionSourceLocation }: ParseContractDefinitionResult,
    { document, uri }: ResolveActionsContext
  ): CodeAction | null {
    const contractToken = tokens.find(
      (t) => "Keyword" && t.value === "contract"
    );

    if (contractToken === undefined || contractToken.range === undefined) {
      return null;
    }

    const startChar =
      functionSourceLocation.start + (contractToken.range?.[0] ?? 0);

    const quickfix = {
      title: `Add abstract to contract declaration`,
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
              newText: "abstract ",
            },
          ],
        },
      },
    };

    return quickfix;
  }
}
