import { ContractDefinitionNode, FunctionDefinition } from "@common/types";

export interface InheritanceLookupTable {
  [key: string]: string[];
}
export interface ContractIdToNodeMapping {
  [key: string]: ContractDefinitionNode;
}

export interface LinearizationContext {
  linearizations: { [key: string]: string[] };
  contracts: ContractIdToNodeMapping;
}

export interface FunctionRecord {
  definition: FunctionDefinition;
  implementedIn: string[];
}
