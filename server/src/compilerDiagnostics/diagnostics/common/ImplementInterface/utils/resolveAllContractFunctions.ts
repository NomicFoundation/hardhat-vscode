import { isFunctionDefinitionNode } from "@analyzer/utils/typeGuards";
import {
  AstMutability,
  AstVisibility,
  ContractDefinitionNode,
  FunctionDefinition,
  mutabliltyPrecedence,
  visibilityPrecedence,
} from "@common/types";
import { FunctionRecord, LinearizationContext } from "../types";
import { isMatchingTypeName } from "./isMatchingTypeName";
import { toContractId } from "./toContractId";

/**
 * Build a combined view of all of a contracts functions, both those
 * directly implemented and those (abstract + impl) in the inheritance
 * graph.
 * @param contractNode the internal ast contract node
 * @param linearizationCtx the linearization lists for each contract in the inheritance graph
 * @returns all a contracts effective functions + info on which contract exist in
 */
export function resolveAllContractFunctions(
  contractNode: ContractDefinitionNode,
  linearizationCtx: LinearizationContext
): FunctionRecord[] {
  const ancestorContracts = findAncestorContractsFor(
    contractNode,
    linearizationCtx
  );

  return ancestorContracts.reverse().reduce(overrideFunctionsWith, []);
}

function overrideFunctionsWith(
  combinedFunctionRecords: FunctionRecord[],
  contractNode: ContractDefinitionNode
) {
  const contractId = toContractId(contractNode);

  const functions = contractNode.children
    .filter(isFunctionDefinitionNode)
    .map((n) => n.astNode);

  const additional: FunctionRecord[] = [];

  for (const fn of functions) {
    const existingFnRecord = combinedFunctionRecords.find((ef) =>
      isSameFunction(ef.definition, fn)
    );

    if (!existingFnRecord) {
      // we don't want to be modifying the analyzer's copy
      // of the ast
      const clonedFun = cloneFunctionDefinition(fn);

      clonedFun.override = [];

      additional.push({
        definition: clonedFun,
        implementedIn: [contractId],
      });
    } else {
      widenFunctionDefinition(existingFnRecord.definition, fn);

      existingFnRecord.implementedIn.push(contractId);
    }
  }

  return combinedFunctionRecords.concat(additional);
}

function findAncestorContractsFor(
  contractNode: ContractDefinitionNode,
  { linearizations, contracts: contractIdToNodeMapping }: LinearizationContext
): ContractDefinitionNode[] {
  return (linearizations[toContractId(contractNode)] ?? [])
    .map((contractId: string) => contractIdToNodeMapping[contractId])
    .filter(Boolean);
}

function isSameFunction(
  left: FunctionDefinition,
  right: FunctionDefinition
): boolean {
  return (
    left.name === right.name &&
    left.parameters.length === right.parameters.length &&
    left.parameters.every((p, i) => {
      const leftTypeName = p.typeName;
      const rightTypeName = right.parameters[i].typeName;

      return (
        leftTypeName &&
        rightTypeName &&
        isMatchingTypeName(leftTypeName, rightTypeName)
      );
    })
  );
}

function cloneFunctionDefinition(
  funAst: FunctionDefinition
): FunctionDefinition {
  const clonedAst: FunctionDefinition = {
    type: "FunctionDefinition",
    name: funAst.name,
    parameters: funAst.parameters,
    modifiers: funAst.modifiers,
    stateMutability: funAst.stateMutability,
    visibility: funAst.visibility,
    returnParameters: funAst.returnParameters,
    isConstructor: funAst.isConstructor,
    isReceiveEther: funAst.isReceiveEther,
    isFallback: funAst.isFallback,
    isVirtual: funAst.isVirtual,

    override: funAst.override,
    body: funAst.body,
  };

  return clonedAst;
}

/**
 * If the overriding function widens the functions signature constraints
 * (e.g. public over external) then reflect this on the existing function.
 * @param existingDefinition function definition node being extended
 * @param next overriding function with potentialy wider signature.
 */
function widenFunctionDefinition(
  existingDefinition: FunctionDefinition,
  next: FunctionDefinition
) {
  existingDefinition.stateMutability = widenMutablity(
    existingDefinition.stateMutability,
    next.stateMutability
  );

  existingDefinition.visibility = widenVisibility(
    existingDefinition.visibility,
    next.visibility
  );

  if (next.body) {
    existingDefinition.body = next.body;
  }
}

function widenMutablity(left: AstMutability, right: AstMutability) {
  const leftIndex = mutabliltyPrecedence.findIndex((i) => i === left);
  const rightIndex = mutabliltyPrecedence.findIndex((i) => i === right);

  return leftIndex >= rightIndex ? left : right;
}

function widenVisibility(left: AstVisibility, right: AstVisibility) {
  const leftIndex = visibilityPrecedence.findIndex((i) => i === left);
  const rightIndex = visibilityPrecedence.findIndex((i) => i === right);

  return leftIndex >= rightIndex ? left : right;
}
