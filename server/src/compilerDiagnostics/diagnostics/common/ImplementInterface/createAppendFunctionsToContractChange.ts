import { Range, TextEdit } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { ContractDefinitionNode, FunctionDefinition } from "@common/types";
import { PrettyPrinter2 } from "../../../../utils/prettier2/PrettyPrinter2";

export function createAppendFunctionsToContractChange(
  contractNode: ContractDefinitionNode,
  functions: FunctionDefinition[],
  { document }: { document: TextDocument }
): TextEdit {
  const prettyPrinter = new PrettyPrinter2();

  const range = Range.create(
    document.positionAt(contractNode.astNode.range?.[0] ?? 0),
    document.positionAt((contractNode.astNode.range?.[1] ?? 0) + 1)
  );

  const originalText = document.getText(range);

  const functionsAppendText = functions
    .map((fun) => prettyPrinter.formatAst(fun, "-", { document }))
    .join("\n\n");

  const newText = prettyPrinter
    .format(`${originalText.slice(0, -1) + functionsAppendText}}`, { document })
    .slice(0, -1);

  return {
    range,
    newText,
  };
}
