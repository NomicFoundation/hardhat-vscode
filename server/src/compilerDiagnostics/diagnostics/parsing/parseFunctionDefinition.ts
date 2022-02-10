import { Diagnostic, Range } from "vscode-languageserver/node";
import * as parser from "@solidity-parser/parser";
import { FunctionDefinition } from "@common/types";
import { Token } from "@solidity-parser/parser/dist/src/types";
import { ResolveActionsContext } from "@compilerDiagnostics/types";

export type ParseFunctionDefinitionResult = {
  functionDefinition: FunctionDefinition;
  tokens: Token[];
  functionSourceLocation: { start: number; end: number };
};

export function parseFunctionDefinition(
  diagnostic: Diagnostic,
  { document, logger }: ResolveActionsContext
): ParseFunctionDefinitionResult | null {
  if (!diagnostic.data) {
    return null;
  }

  try {
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
      ast.tokens === undefined ||
      ast.children.length === 0 ||
      ast.children[0].type !== "FunctionDefinition"
    ) {
      return null;
    }

    const functionDefinition = ast.children[0];

    return { functionDefinition, tokens: ast.tokens, functionSourceLocation };
  } catch (err) {
    logger.error(err);
    return null;
  }
}
