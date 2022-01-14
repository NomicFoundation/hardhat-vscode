import { isFunctionDefinition } from "./typeGuards";
import { ContractDefinitionNode } from "../nodes/ContractDefinitionNode";
import { FunctionDefinitionNode } from "../nodes/FunctionDefinitionNode";

export function lookupConstructorFor(
  contractDefinition: ContractDefinitionNode
): FunctionDefinitionNode | undefined {
  return contractDefinition.children
    .filter(isFunctionDefinition)
    .find((node) => node.isConstructor);
}
