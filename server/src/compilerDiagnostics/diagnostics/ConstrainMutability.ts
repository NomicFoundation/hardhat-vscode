import {
  CodeAction,
  CodeActionKind,
  Diagnostic,
  Range,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { CompilerDiagnostic, ResolveActionsContext } from "../types";
import { attemptConstrainToFunctionName } from "../conversions/attemptConstrainToFunctionName";
import { SolcError, ServerState } from "../../types";
import {
  parseFunctionDefinitionAuto,
  ParseFunctionDefinitionResult,
} from "./parsing/parseFunctionDefinition";
import { getFunctionHeaderShape } from "./parsing/lookupToken";

export class ConstrainMutability implements CompilerDiagnostic {
  public code = "2018";
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
    { document, uri }: ResolveActionsContext
  ): Promise<CodeAction[]> {
    if (!diagnostic.data) {
      return [];
    }

    const parseResult = await parseFunctionDefinitionAuto(
      serverState,
      diagnostic,
      document
    );

    if (parseResult === null) {
      return [];
    }

    const { TerminalKind } = await import("@nomicfoundation/slang/cst");
    const { mutabilityKeyword } = parseResult.functionDefinition;

    if (
      mutabilityKeyword !== undefined &&
      mutabilityKeyword.node.isTerminalNode() &&
      mutabilityKeyword.node.kind === TerminalKind.ViewKeyword
    ) {
      return this._modifyViewToPureAction(document, uri, parseResult);
    }

    return this._addMutabilityAction(diagnostic, document, uri, parseResult);
  }

  private _modifyViewToPureAction(
    document: TextDocument,
    uri: string,
    { functionSourceLocation, functionDefinition }: ParseFunctionDefinitionResult
  ): CodeAction[] {
    const viewKeyword = functionDefinition.mutabilityKeyword;

    if (viewKeyword === undefined) {
      return [];
    }

    const action: CodeAction = {
      title: "Change view modifier to pure in function declaration",
      kind: CodeActionKind.QuickFix,
      isPreferred: true,
      edit: {
        changes: {
          [uri]: [
            {
              range: Range.create(
                document.positionAt(
                  functionSourceLocation.start + viewKeyword.textRange.start.utf8
                ),
                document.positionAt(
                  functionSourceLocation.start + viewKeyword.textRange.end.utf8
                )
              ),
              newText: "pure",
            },
          ],
        },
      },
    };

    return [action];
  }

  private _addMutabilityAction(
    diagnostic: Diagnostic,
    document: TextDocument,
    uri: string,
    {
      functionSourceLocation,
      cursors,
      functionDefinition,
    }: ParseFunctionDefinitionResult
  ): CodeAction[] {
    const modifier = diagnostic.message.includes("pure") ? "pure" : "view";
    const visibilityKeyword = functionDefinition.visibilityKeyword;

    if (visibilityKeyword === undefined) {
      return [];
    }

    const shape = getFunctionHeaderShape(cursors, document, functionSourceLocation);

    if (shape === null) {
      return [];
    }

    const visibilityKeywordPosition = document.positionAt(
      functionSourceLocation.start + visibilityKeyword.textRange.start.utf8 + 1
    );

    const newText = shape.isSameLine
      ? `${modifier} `
      : `${"".padStart(visibilityKeywordPosition.character - 1)}${modifier}\n`;

    const endOfVisibilityChar =
      functionSourceLocation.start + visibilityKeyword.textRange.end.utf8 + 1;

    const addMutabilityAction: CodeAction = {
      title: `Add ${modifier} modifier to function declaration`,
      kind: CodeActionKind.QuickFix,
      isPreferred: true,
      edit: {
        changes: {
          [uri]: [
            {
              range: Range.create(
                document.positionAt(endOfVisibilityChar),
                document.positionAt(endOfVisibilityChar)
              ),
              newText,
            },
          ],
        },
      },
    };

    return [addMutabilityAction];
  }
}
