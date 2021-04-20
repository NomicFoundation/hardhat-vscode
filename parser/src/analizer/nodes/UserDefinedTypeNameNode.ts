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

        if (userDefinedTypeName.loc) {
            // Bug in solidity parser doesn't give exact end location
            userDefinedTypeName.loc.end.column = userDefinedTypeName.loc.end.column + userDefinedTypeName.namePath.length

            this.nameLoc = JSON.parse(JSON.stringify(userDefinedTypeName.loc));
        }

        this.astNode = userDefinedTypeName;
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

    }
}
