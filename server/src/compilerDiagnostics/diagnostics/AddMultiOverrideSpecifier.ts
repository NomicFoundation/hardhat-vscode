import { CodeAction, Diagnostic } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  CompilerDiagnostic,
  HardhatCompilerError,
  ResolveActionsContext,
} from "../types";
import { attemptConstrainToFunctionName } from "../conversions/attemptConstrainToFunctionName";
import {
  Multioverride,
  resolveInsertSpecifierQuickFix,
} from "./common/resolveInsertSpecifierQuickFix";

export class AddMultiOverrideSpecifier implements CompilerDiagnostic {
  public code = "4327";
  public blocks: string[] = ["9456"];

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
    const missingContractIdentifiers = this.parseContractIdentifiersFromMessage(
      diagnostic.message
    );

    const multiOverride = new Multioverride(missingContractIdentifiers);

    return resolveInsertSpecifierQuickFix(multiOverride, diagnostic, context);
  }

  public parseContractIdentifiersFromMessage(message: string) {
    const regex = /"(?<contract>\w+)"(\.|,\s|\sand\s)/gm;

    const matches = message.matchAll(regex);

    const missingContractIdentifiers: string[] = [...matches]
      .map((match) => match.groups?.contract)
      .filter((contract): contract is string => contract !== undefined);

    return missingContractIdentifiers;
  }
}
