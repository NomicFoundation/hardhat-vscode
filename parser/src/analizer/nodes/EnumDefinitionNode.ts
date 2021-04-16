import { AST, EnumDefinition } from "@solidity-parser/parser/dist/ast-types";

import { Location, Node } from "./Node";

export class EnumDefinitionNode implements Node {
    type: string;

    uri: string;
    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    astNode: AST;

    constructor (enumDefinition: EnumDefinition, uri: string) {
        this.type = enumDefinition.type;

        this.uri = uri;
        // TO-DO: Implement name location for rename

        this.astNode = enumDefinition;
    }

    addChild(child: Node): void {
        this.children.push(child);
    }

    setParent(parent: Node): void {
        this.parent = parent;
    }

    accept(orphanNodes: Node[], parent?: Node): void {
        // TO-DO: Method not implemented
    }
}
