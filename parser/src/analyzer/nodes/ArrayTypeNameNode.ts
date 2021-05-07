import { ArrayTypeName } from "@solidity-parser/parser/dist/src/ast-types";

import { Location, FinderType, Node, Position } from "./Node";

export class ArrayTypeNameNode implements Node {
    type: string;
    uri: string;
    astNode: ArrayTypeName;

    nameLoc?: Location | undefined;

    expressionNode?: Node | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (arrayTypeName: ArrayTypeName, uri: string) {
        this.type = arrayTypeName.type;
        this.uri = uri;
        this.astNode = arrayTypeName;
        // TO-DO: Implement name location for rename
    }

    getTypeNodes(): Node[] {
        let nodes: Node[] = [];

        this.typeNodes.forEach(typeNode => {
            nodes = nodes.concat(typeNode.getTypeNodes());
        });

        return nodes;
    }

    addTypeNode(node: Node): void {
        this.typeNodes.push(node);
    }

    getExpressionNode(): Node | undefined {
        return this.expressionNode;
    }

    setExpressionNode(node: Node | undefined): void {
        this.expressionNode = node;
    }

    getDefinitionNode(): Node {
        // TO-DO: Method not implemented
        return this;
    }

    getName(): string | undefined {
        return undefined;
    }

    addChild(child: Node): void {
        this.children.push(child);
    }

    setParent(parent: Node | undefined): void {
        this.parent = parent;
    }

    getParent(): Node | undefined {
        return this.parent;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node): Node {
        const typeNode = find(this.astNode.baseTypeName, this.uri).accept(find, orphanNodes, parent);

        if (typeNode) {
            this.addTypeNode(typeNode);
        }

        return this;
    }
}
