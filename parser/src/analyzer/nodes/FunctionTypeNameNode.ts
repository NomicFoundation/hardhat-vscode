import { FunctionTypeName } from "@solidity-parser/parser/dist/src/ast-types";

import { Location, FinderType, Node, Position } from "./Node";

export class FunctionTypeNameNode implements Node {
    type: string;
    uri: string;
    astNode: FunctionTypeName;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (functionTypeName: FunctionTypeName, uri: string) {
        this.type = functionTypeName.type;
        this.uri = uri;
        this.astNode = functionTypeName;
        // TO-DO: Implement name location for rename
    }

    getTypeNodes(): Node[] {
        return this.typeNodes;
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

    accept(find: FinderType, orphanNodes: Node[], parent?: Node): Node {
        // TO-DO: Method not implemented
        return this;
    }

    getDefinitionNode(): Node {
        // TO-DO: Method not implemented
        return this;
    }
}
