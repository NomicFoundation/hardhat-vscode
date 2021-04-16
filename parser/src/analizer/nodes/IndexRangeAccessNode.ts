import { AST, IndexRangeAccess } from "@solidity-parser/parser/dist/ast-types";

import { FinderType } from "../matcher";
import { Node } from "./Node";

export class IndexRangeAccessNode extends Node<IndexRangeAccess> {
    constructor(indexRangeAccess: IndexRangeAccess, uri: string) {
        // TO-DO: Implement name location for rename (maybe have it as part of the abstract class)
        super(indexRangeAccess, uri);
    }

    accept<K extends AST>(find: FinderType, orphanNodes: Node<K>[], parent?: Node<K>): void {
        // TO-DO: Implement accept
    }
}
