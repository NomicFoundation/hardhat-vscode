import { AST, Identifier } from "@solidity-parser/parser/dist/ast-types";

import { FinderType } from "../matcher";
import { Node } from "./Node";

export class IdentifierNode extends Node<Identifier> {
    constructor(identifier: Identifier, uri: string) {
        // TO-DO: Implement name location for rename (maybe have it as part of the abstract class)
        super(identifier, uri);
    }

    accept<K extends AST>(find: FinderType, orphanNodes: Node<K>[], parent?: Node<K>): void {
        // TO-DO: Implement accept
    }
}
