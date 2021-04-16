import { AST, AssemblyFor } from "@solidity-parser/parser/dist/ast-types";

import { FinderType } from "../matcher";
import { Node } from "./Node";

export class AssemblyForNode extends Node<AssemblyFor> {
    constructor(assemblyFor: AssemblyFor, uri: string) {
        // TO-DO: Implement name location for rename (maybe have it as part of the abstract class)
        super(assemblyFor, uri);
    }

    accept<K extends AST>(find: FinderType, orphanNodes: Node<K>[], parent?: Node<K>): void {
        // TO-DO: Implement accept
    }
}
