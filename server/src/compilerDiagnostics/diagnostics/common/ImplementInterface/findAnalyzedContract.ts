import { ResolveActionsContext } from "../../../types";
import { ParseContractDefinitionResult } from "../../parsing/parseContractDefinition";
import { ContractDefinitionNode, DocumentAnalyzer } from "@common/types";
import { isContractDefinitionNode } from "@analyzer/utils/typeGuards";
import { lookupEntryForDocument } from "@utils/lookupEntryForDocument";

export function findAnalyzedContract(
  { contractDefinition, functionSourceLocation }: ParseContractDefinitionResult,
  { document, analyzer }: ResolveActionsContext
): ContractDefinitionNode | null {
  if (!contractDefinition.range) {
    return null;
  }

  const currentAnalyzer = lookupEntryForDocument(analyzer, document);

  if (!currentAnalyzer.isAnalyzed) {
    return null;
  }

  const internalContractNode = findEquivalentAnalyzerContractNode(
    currentAnalyzer,
    {
      start: functionSourceLocation.start + contractDefinition.range[0],
      end: functionSourceLocation.start + contractDefinition.range[1],
    }
  );

  return internalContractNode ?? null;
}

function findEquivalentAnalyzerContractNode(
  currentAnalyzer: DocumentAnalyzer,
  { start, end }: { start: number; end: number }
): ContractDefinitionNode | undefined {
  return currentAnalyzer.analyzerTree.tree.children
    .filter(isContractDefinitionNode)
    .find(
      (con) =>
        con.type === "ContractDefinition" &&
        con.astNode.range &&
        con.astNode.range[0] === start &&
        con.astNode.range[1] === end
    );
}
