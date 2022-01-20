import { ContractDefinitionNode, FunctionDefinition } from "@common/types";

export type InheritanceLookupTable = { [key: string]: string[] };
export type ContractIdToNodeMapping = { [key: string]: ContractDefinitionNode };

export type LinearizationContext = {
  linearizations: { [key: string]: string[] };
  contracts: ContractIdToNodeMapping;
};

export type FunctionRecord = {
  definition: FunctionDefinition;
  implementedIn: string[];
};
