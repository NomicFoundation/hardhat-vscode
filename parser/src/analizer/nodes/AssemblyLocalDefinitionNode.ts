import { AST, AssemblyLocalDefinition } from "@solidity-parser/parser/dist/ast-types";

import { FinderType } from "../matcher";
import { Node } from "./Node";

export class AssemblyLocalDefinitionNode extends Node<AssemblyLocalDefinition> {
    constructor(assemblyLocalDefinition: AssemblyLocalDefinition, uri: string) {
        // TO-DO: Implement name location for rename (maybe have it as part of the abstract class)
        super(assemblyLocalDefinition, uri);
    }

    accept<K extends AST>(find: FinderType, orphanNodes: Node<K>[], parent?: Node<K>): void {
        // TO-DO: Implement accept
    }
}
