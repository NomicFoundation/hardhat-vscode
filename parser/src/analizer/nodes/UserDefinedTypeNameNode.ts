import { UserDefinedTypeName } from "@solidity-parser/parser/dist/ast-types";

import { Location, FinderType, Node } from "./Node";

export class UserDefinedTypeNameNode implements Node {
    type: string;
    uri: string;
    astNode: UserDefinedTypeName;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    constructor (userDefinedTypeName: UserDefinedTypeName, uri: string) {
        this.type = userDefinedTypeName.type;
        this.uri = uri;
        this.astNode = userDefinedTypeName;
        // TO-DO: Implement name location for rename
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
