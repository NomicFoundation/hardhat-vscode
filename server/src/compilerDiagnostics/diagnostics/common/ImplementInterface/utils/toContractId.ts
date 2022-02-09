import { ContractDefinitionNode } from "@common/types";

export function toContractId(node: ContractDefinitionNode): string {
  return `${node.uri}::${node.name}`;
}
