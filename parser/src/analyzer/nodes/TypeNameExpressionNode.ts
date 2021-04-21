import { TypeNameExpression } from "@solidity-parser/parser/dist/ast-types";

import { Location, FinderType, Node } from "./Node";

export class TypeNameExpressionNode implements Node {
    type: string;
    uri: string;
    astNode: TypeNameExpression;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    constructor (typeNameExpression: TypeNameExpression, uri: string) {
        this.type = typeNameExpression.type;
        this.uri = uri;
        this.astNode = typeNameExpression;
        // TO-DO: Implement name location for rename
    }

    getName(): string | undefined {
        return undefined;
    }

    addChild(child: Node): void {
        this.children.push(child);
    }

    setParent(parent: Node): void {
        this.parent = parent;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node): void {
        // TO-DO: Method not implemented
    }
}
