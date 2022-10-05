import {
  CodeAction,
  CodeActionKind,
  Diagnostic,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { CompilerDiagnostic, ResolveActionsContext } from "../types";
import { attemptConstrainToFunctionName } from "../conversions/attemptConstrainToFunctionName";
import { SolcError, ServerState } from "../../types";
import {
  Multioverride,
  resolveInsertSpecifierQuickFix,
} from "./common/resolveInsertSpecifierQuickFix";

const OVERRIDE_REGEX = /^override\s*(\((.*)\))?$/;

export class AddMultiOverrideSpecifier implements CompilerDiagnostic {
  public code = "4327";
  public blocks: string[] = ["9456"];

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
    const missingContractIdentifiers = this.parseContractIdentifiersFromMessage(
      diagnostic.message
    );

    const multiOverride = new Multioverride(missingContractIdentifiers);

    // When no specifier is present, solc sourceLocation covers the whole function body
    // so we can apply the general quickfix for specifiers
    const insertSpecifierQuickfix = resolveInsertSpecifierQuickFix(
      multiOverride,
      diagnostic,
      context,
      serverState.logger
    );

    if (insertSpecifierQuickfix.length > 0) {
      return insertSpecifierQuickfix;
    }

    // If just 'override' or 'override(A)' is present, assuming there are more
    // contracts that need to be specified besides A, solc error sourceLocation only
    // covers the `override(...)` string
    const updateSpecifierQuickfix = this._tryUpdateOverride(
      context,
      diagnostic,
      multiOverride
    );

    if (updateSpecifierQuickfix.length > 0) {
      return updateSpecifierQuickfix;
    }

    return [];
  }

  public parseContractIdentifiersFromMessage(message: string) {
    const regex = /"(?<contract>\w+)"(\.|,\s|\sand\s)/gm;

    const matches = message.matchAll(regex);

    const missingContractIdentifiers: string[] = [...matches]
      .map((match) => match.groups?.contract)
      .filter((contract): contract is string => contract !== undefined);

    return missingContractIdentifiers;
  }

  private _isOverrideSpecifier(specifier: string): boolean {
    return OVERRIDE_REGEX.test(specifier);
  }

  private _getOverridenContracts(specifier: string): string[] {
    const match = specifier.match(OVERRIDE_REGEX);
    const overridenContractString = (match && (match[2] as string)) || "";
    return overridenContractString
      .split(/\s*,\s*/)
      .map((s) => s.trim())
      .filter((s) => s);
  }

  private _tryUpdateOverride(
    context: ResolveActionsContext,
    diagnostic: Diagnostic,
    multiOverride: Multioverride
  ) {
    const sourceError = context.document.getText(diagnostic.range);
    if (this._isOverrideSpecifier(sourceError)) {
      const overridenContracts = this._getOverridenContracts(sourceError);
      multiOverride.contractIdentifiers.push(...overridenContracts);

      return [
        {
          title: "Add missing contracts to specifier",
          kind: CodeActionKind.QuickFix,
          isPreferred: true,
          edit: {
            changes: {
              [context.uri]: [
                {
                  range: diagnostic.range,
                  newText: multiOverride.toString(),
                },
              ],
            },
          },
        },
      ];
    } else {
      return [];
    }
  }
}
