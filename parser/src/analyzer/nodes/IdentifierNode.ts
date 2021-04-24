import { Identifier } from "@solidity-parser/parser/dist/ast-types";

import * as finder from "../finder";
import { Location, FinderType, Node } from "./Node";

export class IdentifierNode implements Node {
    type: string;
    uri: string;
    astNode: Identifier;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (identifier: Identifier, uri: string) {
        this.type = identifier.type;
        this.uri = uri;
        
        if (identifier.loc) {
            // Bug in solidity parser doesn't give exact end location
            identifier.loc.end.column = identifier.loc.end.column + identifier.name.length

            this.nameLoc = JSON.parse(JSON.stringify(identifier.loc));
        }

        this.astNode = identifier;
    }

    getTypeNodes(): Node[] {
        return [];
    }

    getName(): string | undefined {
        return this.astNode.name;
    }

    addChild(child: Node): void {
        this.children.push(child);
    }

    setParent(parent: Node): void {
        this.parent = parent;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node): Node {
        if (parent) {
            const identifierParent = finder.findParent(this, parent);

            if (identifierParent) {
                this.setParent(identifierParent);
                identifierParent?.addChild(this);

                return this;
            }
        }

        orphanNodes.push(this);

        return this;
    }
}
