import { UsingForDeclaration } from "@solidity-parser/parser/dist/src/ast-types";

import * as finder from "@common/finder";
import { Location, FinderType, DocumentsAnalyzerMap, DocumentsAnalyzerTree, Node } from "@nodes/Node";

export class UsingForDeclarationNode implements Node {
    type: string;
    uri: string;
    astNode: UsingForDeclaration;

    isAlive = true;

    nameLoc?: Location | undefined;

    aliasName?: string | undefined;

    expressionNode?: Node | undefined;
    declarationNode?: Node | undefined;

    connectionTypeRules: string[] = [ "ContractDefinition" ];

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (usingForDeclaration: UsingForDeclaration, uri: string) {
        this.type = usingForDeclaration.type;
        this.uri = uri;
        this.astNode = usingForDeclaration;

        if (usingForDeclaration.loc && usingForDeclaration.libraryName) {
            this.nameLoc = {
                start: {
                    line: usingForDeclaration.loc.start.line,
                    column: usingForDeclaration.loc.start.column + "using ".length
                },
                end: {
                    line: usingForDeclaration.loc.start.line,
                    column: usingForDeclaration.loc.start.column + "using ".length + (this.getName()?.length || 0)
                }
            };
        }
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
        return this.parent?.getDefinitionNode();
    }

    getName(): string | undefined {
        return this.astNode.libraryName;
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

        child.isAlive = false;
    }

    setParent(parent: Node | undefined): void {
        this.parent = parent;
    }

    getParent(): Node | undefined {
        return this.parent;
    }

    accept(find: FinderType, documentsAnalyzer: DocumentsAnalyzerMap, documentsAnalyzerTree: DocumentsAnalyzerTree, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (this.astNode.typeName) {
            find(this.astNode.typeName, this.uri).accept(find, documentsAnalyzer, documentsAnalyzerTree, orphanNodes, parent);
        }

        if (parent) {
            const identifierParent = finder.findParent(this, parent);

            if (identifierParent) {
                this.addTypeNode(identifierParent);

                this.setParent(identifierParent);
                identifierParent?.addChild(this);

                return this;
            }
        }

        orphanNodes.push(this);

        return this;
    }
}
