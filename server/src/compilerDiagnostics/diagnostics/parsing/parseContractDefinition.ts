import { Diagnostic, Range } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import * as parser from "@solidity-parser/parser";
import { ContractDefinition } from "@common/types";
import { Token } from "@solidity-parser/parser/dist/src/types";

export type ParseContractDefinitionResult = {
  contractDefinition: ContractDefinition;
  tokens: Token[];
  functionSourceLocation: { start: number; end: number };
};

export function parseContractDefinition(
  diagnostic: Diagnostic,
  document: TextDocument
): ParseContractDefinitionResult | null {
  if (!diagnostic.data) {
    return null;
  }

  try {
    const { functionSourceLocation } = diagnostic.data as {
      functionSourceLocation: { start: number; end: number };
    };

    const contractText = document.getText(
      Range.create(
        document.positionAt(functionSourceLocation.start),
        document.positionAt(functionSourceLocation.end)
      )
    );

    const ast = parser.parse(contractText, {
      range: true,
      tolerant: true,
      tokens: true,
    });

    if (
      ast.tokens === undefined ||
      ast.children.length === 0 ||
      ast.children[0].type !== "ContractDefinition"
    ) {
      return null;
    }

    const definition = ast.children[0];

    return {
      contractDefinition: definition,
      tokens: ast.tokens,
      functionSourceLocation,
    };
  } catch {
    return null;
  }
}
