import { isFunctionDefinitionNode } from "./typeGuards";
import { ContractDefinitionNode } from "../nodes/ContractDefinitionNode";
import { FunctionDefinitionNode } from "../nodes/FunctionDefinitionNode";

export function lookupConstructorFor(
  contractDefinition: ContractDefinitionNode
): FunctionDefinitionNode | undefined {
  return contractDefinition.children
    .filter(isFunctionDefinitionNode)
    .find((node) => node.isConstructor);
}
