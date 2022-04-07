import { CodeAction, Diagnostic } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  CompilerDiagnostic,
  HardhatCompilerError,
  ResolveActionsContext,
} from "../types";
import { attemptConstrainToFunctionName } from "../conversions/attemptConstrainToFunctionName";
import { resolveInsertSpecifierQuickFix } from "./common/resolveInsertSpecifierQuickFix";
import { ServerState } from "types";

export class AddVirtualSpecifier implements CompilerDiagnostic {
  public code = "4334";
  public blocks: string[] = [];

  fromHardhatCompilerError(
    document: TextDocument,
    error: HardhatCompilerError
  ): Diagnostic {
    return attemptConstrainToFunctionName(document, error);
  }

  resolveActions(
    serverState: ServerState,
    diagnostic: Diagnostic,
    context: ResolveActionsContext
  ): CodeAction[] {
    return resolveInsertSpecifierQuickFix(
      "virtual",
      diagnostic,
      context,
      serverState.logger
    );
  }
}
