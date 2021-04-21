import { Identifier } from "@solidity-parser/parser/dist/ast-types";

import { Finder } from "../finder";
import { Location, FinderType, Node } from "./Node";

export class IdentifierNode implements Node {
    type: string;
    uri: string;
    astNode: Identifier;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

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
        if (parent) {
            const identifierParent = Finder.findParent(this, parent);

            if (identifierParent) {
                this.setParent(identifierParent);
                identifierParent?.addChild(this);

                return;
            }
        }

        orphanNodes.push(this);
    }
}
