import { AST, BinaryOperation } from "@solidity-parser/parser/dist/ast-types";

import { FinderType } from "../matcher";
import { Node } from "./Node";

export class BinaryOperationNode extends Node<BinaryOperation> {
    constructor(binaryOperation: BinaryOperation, uri: string) {
        // TO-DO: Implement name location for rename (maybe have it as part of the abstract class)
        super(binaryOperation, uri);
    }

    accept<K extends AST>(find: FinderType, orphanNodes: Node<K>[], parent?: Node<K>): void {
        // TO-DO: Implement accept
    }
}
