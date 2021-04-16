import { AST, NewExpression } from "@solidity-parser/parser/dist/ast-types";

import { FinderType } from "../matcher";
import { Node } from "./Node";

export class NewExpressionNode extends Node<NewExpression> {
    constructor(newExpression: NewExpression, uri: string) {
        // TO-DO: Implement name location for rename (maybe have it as part of the abstract class)
        super(newExpression, uri);
    }

    accept<K extends AST>(find: FinderType, orphanNodes: Node<K>[], parent?: Node<K>): void {
        // TO-DO: Implement accept
    }
}
