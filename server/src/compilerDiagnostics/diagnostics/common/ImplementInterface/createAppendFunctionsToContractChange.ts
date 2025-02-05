import { Range, TextEdit } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { ContractDefinitionNode, FunctionDefinition } from "@common/types";
import { PrettyPrinter } from "../../../../utils/PrettyPrinter";

export async function createAppendFunctionsToContractChange(
  contractNode: ContractDefinitionNode,
  functions: FunctionDefinition[],
  { document }: { document: TextDocument }
): Promise<TextEdit> {
  const prettyPrinter = new PrettyPrinter();

  const range = Range.create(
    document.positionAt(contractNode.astNode.range?.[0] ?? 0),
    document.positionAt((contractNode.astNode.range?.[1] ?? 0) + 1)
  );

  const originalText = document.getText(range);

  const functionsText = await Promise.all(
    functions.map((fun) => prettyPrinter.formatAst(fun, "-", { document }))
  );

  const functionsAppendText = functionsText.join("\n\n");

  const textToFormat = `${originalText.slice(0, -1) + functionsAppendText}}`;

  const newText = (
    await prettyPrinter.format(textToFormat, { document })
  ).slice(0, -1);

  return {
    range,
    newText,
  };
}
