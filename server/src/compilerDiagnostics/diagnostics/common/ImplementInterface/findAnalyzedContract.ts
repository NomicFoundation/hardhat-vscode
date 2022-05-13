import {
  ContractDefinitionNode,
  ISolFileEntry,
  SolFileState,
} from "@common/types";
import { isContractDefinitionNode } from "@analyzer/utils/typeGuards";
import { getOrInitialiseSolFileEntry } from "@utils/getOrInitialiseSolFileEntry";
import { decodeUriAndRemoveFilePrefix } from "@utils/index";
import { ParseContractDefinitionResult } from "../../parsing/parseContractDefinition";
import { ResolveActionsContext } from "../../../types";
import { ServerState } from "../../../../types";

export function findAnalyzedContract(
  serverState: ServerState,
  { contractDefinition, functionSourceLocation }: ParseContractDefinitionResult,
  { document }: ResolveActionsContext
): ContractDefinitionNode | null {
  if (!contractDefinition.range) {
    return null;
  }

  const currentAnalyzer = getOrInitialiseSolFileEntry(
    serverState,
    decodeUriAndRemoveFilePrefix(document.uri)
  );

  if (currentAnalyzer.status !== SolFileState.ANALYZED) {
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
  currentAnalyzer: ISolFileEntry,
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
