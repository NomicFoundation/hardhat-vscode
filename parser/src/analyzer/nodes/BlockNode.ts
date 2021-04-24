import { Block } from "@solidity-parser/parser/dist/ast-types";

import { Location, FinderType, Node } from "./Node";

export class BlockNode implements Node {
    type: string;
    uri: string;
    astNode: Block;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (block: Block, uri: string) {
        this.type = block.type;
        this.uri = uri;
        this.astNode = block;
    }

    getTypeNodes(): Node[] {
        return [];
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
        for (const statement of this.astNode.statements) {
            find(statement, this.uri).accept(find, orphanNodes, parent);
        }
        
        return this;
    }
}
