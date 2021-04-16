import { AST, ContinueStatement } from "@solidity-parser/parser/dist/ast-types";

import { FinderType } from "../matcher";
import { Node } from "./Node";

export class ContinueStatementNode extends Node<ContinueStatement> {
    constructor(continueStatement: ContinueStatement, uri: string) {
        // TO-DO: Implement name location for rename (maybe have it as part of the abstract class)
        super(continueStatement, uri);
    }

    accept<K extends AST>(find: FinderType, orphanNodes: Node<K>[], parent?: Node<K>): void {
        // TO-DO: Implement accept
    }
}
