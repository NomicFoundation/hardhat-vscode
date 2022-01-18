import {
  CodeAction,
  CodeActionKind,
  Diagnostic,
  Range,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import * as parser from "@solidity-parser/parser";
import { CompilerDiagnostic } from "../types";
import { attemptConstrainToFunctionName } from "../conversions/attemptConstrainToFunctionName";

export class ConstrainMutability implements CompilerDiagnostic {
  public code = "2018";

  fromHardhatCompilerError(
    document: TextDocument,
    error: {
      errorCode: string;
      severity: "error" | "warning";
      message: string;
      sourceLocation: { start: number; end: number };
    }
  ): Diagnostic {
    return attemptConstrainToFunctionName(document, error);
  }

  resolveActions(
    diagnostic: Diagnostic,
    { document, uri }: { document: TextDocument; uri: string }
  ): CodeAction[] {
    if (!diagnostic.data) {
      return [];
    }

    const modifier = diagnostic.message.includes("pure") ? "pure" : "view";

    const { functionSourceLocation } = diagnostic.data as {
      functionSourceLocation: { start: number; end: number };
    };

    const functionText = document.getText(
      Range.create(
        document.positionAt(functionSourceLocation.start),
        document.positionAt(functionSourceLocation.end)
      )
    );

    const ast = parser.parse(functionText, {
      range: true,
      tolerant: true,
      tokens: true,
    });

    if (
      ast.children.length === 0 ||
      ast.children[0].type !== "FunctionDefinition"
    ) {
      return [];
    }

    const functionDefinitionNode = ast.children[0];
    const mutability = functionDefinitionNode.stateMutability;

    if (mutability === "view") {
      return this.modifyViewToPureAction(
        document,
        ast,
        functionSourceLocation,
        uri
      );
    } else {
      return this.addMutabilityAction(
        document,
        ast,
        functionSourceLocation,
        uri,
        functionDefinitionNode.visibility,
        modifier
      );
    }
  }

  private modifyViewToPureAction(
    document: TextDocument,
    ast: ReturnType<typeof parser.parse>,
    functionSourceLocation: { start: number; end: number },
    uri: string
  ): CodeAction[] {
    const viewKeyword = ast.tokens?.find(
      (t) => t.type === "Keyword" && t.value === "view"
    );

    if (!viewKeyword || !viewKeyword.range) {
      throw new Error("Unable to find keyword `view`");
    }

    const action: CodeAction = {
      title: "Change view modifier to pure",
      kind: CodeActionKind.QuickFix,
      isPreferred: true,
      edit: {
        changes: {
          [uri]: [
            {
              range: Range.create(
                document.positionAt(
                  functionSourceLocation.start + viewKeyword.range[0]
                ),
                document.positionAt(
                  functionSourceLocation.start + viewKeyword.range[1]
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

  private addMutabilityAction(
    document: TextDocument,
    ast: ReturnType<typeof parser.parse>,
    functionSourceLocation: { start: number; end: number },
    uri: string,
    visibilty: string,
    modifier: string
  ): CodeAction[] {
    if (!ast.tokens) {
      return [];
    }

    const visibilityKeywordIndex = ast.tokens.findIndex(
      (t) => t.type === "Keyword" && t.value === visibilty
    );

    const visibilityKeyword = ast.tokens[visibilityKeywordIndex];
    const nextToken = ast.tokens[visibilityKeywordIndex + 1];

    if (
      !visibilityKeyword ||
      !visibilityKeyword.range ||
      !nextToken ||
      !nextToken.range
    ) {
      return [];
    }

    const visibilityKeywordPosition = document.positionAt(
      functionSourceLocation.start + visibilityKeyword.range[0] + 1
    );
    const visibilityKeywordLine = visibilityKeywordPosition.line;
    const nextTokenLine = document.positionAt(
      functionSourceLocation.start + nextToken.range[0] + 1
    ).line;

    const newText =
      visibilityKeywordLine === nextTokenLine
        ? `${modifier} `
        : `${"".padStart(
            visibilityKeywordPosition.character - 1
          )}${modifier}\n`;

    const endOfVisibilityChar =
      functionSourceLocation.start + visibilityKeyword.range[1] + 1;

    const addMutabilityAction: CodeAction = {
      title: `Add ${modifier} modifier`,
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
