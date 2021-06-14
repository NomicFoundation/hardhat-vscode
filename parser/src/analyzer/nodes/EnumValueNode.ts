import { EnumValue } from "@solidity-parser/parser/dist/src/ast-types";

import { Location, FinderType, DocumentsAnalyzerMap, DocumentsAnalyzerTree, Node } from "./Node";

export class EnumValueNode implements Node {
    type: string;
    uri: string;
    astNode: EnumValue;

    alive = true;

    nameLoc?: Location | undefined;

    aliasName?: string | undefined;

    expressionNode?: Node | undefined;
    declarationNode?: Node | undefined;

    connectionTypeRules: string[] = [ "MemberAccess" ];

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (enumValue: EnumValue, uri: string) {
        this.type = enumValue.type;
        this.uri = uri;

        if (enumValue.loc) {
            // Bug in solidity parser doesn't give exact end location
            enumValue.loc.end.column = enumValue.loc.end.column + enumValue.name.length;

            this.nameLoc = JSON.parse(JSON.stringify(enumValue.loc));
        }

        this.astNode = enumValue;
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

    getDeclarationNode(): Node | undefined {
        return this.declarationNode;
    }

    setDeclarationNode(node: Node | undefined): void {
        this.declarationNode = node;
    }

    getDefinitionNode(): Node | undefined {
        return this;
    }

    getName(): string | undefined {
        return this.astNode.name;
    }

    getAliasName(): string | undefined {
        return this.aliasName;
    }

    setAliasName(aliasName: string | undefined): void {
        this.aliasName = aliasName;
    }

    addChild(child: Node): void {
        this.children.push(child);
    }

    removeChild(child: Node): void {
        const index = this.children.indexOf(child, 0);

        if (index > -1) {
            this.children.splice(index, 1);
        }

        child.alive = false;
    }

    setParent(parent: Node | undefined): void {
        this.parent = parent;
    }

    getParent(): Node | undefined {
        return this.parent;
    }

    accept(find: FinderType, documentsAnalyzer: DocumentsAnalyzerMap, documentsAnalyzerTree: DocumentsAnalyzerTree, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (parent) {
            this.setParent(parent);
        }

        parent?.addChild(this);

        return this;
    }
}
