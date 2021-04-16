import { AST, Block } from "@solidity-parser/parser/dist/ast-types";

import { FinderType } from "../matcher";
import { Node } from "./Node";

export class BlockNode extends Node<Block> {
    constructor(block: Block, uri: string) {
        // TO-DO: Implement name location for rename (maybe have it as part of the abstract class)
        super(block, uri);
    }

    accept<K extends AST>(find: FinderType, orphanNodes: Node<K>[], parent?: Node<K>): void {
        // TO-DO: Implement accept
    }
}
