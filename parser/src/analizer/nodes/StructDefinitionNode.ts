import { AST, StructDefinition } from "@solidity-parser/parser/dist/ast-types";

import { Location, Node } from './Node';

class StructDefinitionNode implements Node {
    type: string;

    uri: string;
    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    astNode: AST;

    constructor (uri: string, structDefinition: StructDefinition) {
        this.type = structDefinition.type;

        this.uri = uri;
        // TO-DO: Implement name location for rename

        this.astNode = structDefinition;
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
