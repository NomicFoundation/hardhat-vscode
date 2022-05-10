import { ContractDefinitionNode } from "../nodes/ContractDefinitionNode";
import { FunctionDefinitionNode } from "../nodes/FunctionDefinitionNode";
import { isFunctionDefinitionNode } from "./typeGuards";

export function lookupConstructorFor(
  contractDefinition: ContractDefinitionNode
): FunctionDefinitionNode | undefined {
  return contractDefinition.children
    .filter(isFunctionDefinitionNode)
    .find((node) => node.isConstructor);
}
