import { FileLevelConstant } from "@solidity-parser/parser/dist/src/ast-types";

import { Location, FinderType, DocumentsAnalyzerMap, DocumentsAnalyzerTree, Node } from "@nodes/Node";

export class FileLevelConstantNode implements Node {
    type: string;
    uri: string;
    astNode: FileLevelConstant;

    isAlive = true;

    nameLoc?: Location | undefined;

    aliasName?: string | undefined;

    expressionNode?: Node | undefined;
    declarationNode?: Node | undefined;

    connectionTypeRules: string[] = [ "Identifier" ];

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (fileLevelConstant: FileLevelConstant, uri: string) {
        this.type = fileLevelConstant.type;
        this.uri = uri;
        this.astNode = fileLevelConstant;

        if (fileLevelConstant.loc && fileLevelConstant.name) {
            this.nameLoc = {
                start: {
                    line: fileLevelConstant.loc.end.line,
                    column: fileLevelConstant.loc.end.column - fileLevelConstant.name.length
                },
                end: {
                    line: fileLevelConstant.loc.end.line,
                    column: fileLevelConstant.loc.end.column
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

        if (parent) {
            this.setParent(parent);
        }

        if (this.astNode.typeName) {
            const typeNode = find(this.astNode.typeName, this.uri).accept(find, documentsAnalyzer, documentsAnalyzerTree, orphanNodes, this);
        
            this.addTypeNode(typeNode);
            typeNode.setDeclarationNode(this);

            this.updateLocationName(typeNode);
        }

        if (this.astNode.initialValue) {
            find(this.astNode.initialValue, this.uri).accept(find, documentsAnalyzer, documentsAnalyzerTree, orphanNodes, parent);
        }

        parent?.addChild(this);

        return this;
    }

    updateLocationName(typeNode: Node): void {
        if (this.astNode.loc && this.nameLoc && typeNode.astNode.range) {
            const diff = 1 + (+typeNode.astNode.range[1] - +typeNode.astNode.range[0]);

            this.nameLoc.start.column = this.astNode.loc.start.column + diff + 1;
            this.nameLoc.end.column = this.nameLoc.start.column + (this.getName()?.length || 0);

            if (this.astNode.isDeclaredConst) {
                this.nameLoc.start.column += "constant ".length;
                this.nameLoc.end.column += "constant ".length;
            }

            if (this.astNode.isImmutable) {
                this.nameLoc.start.column += "immutable ".length;
                this.nameLoc.end.column += "immutable ".length;
            }

            if (this.astNode.loc.end.column < this.nameLoc.end.column) {
                this.astNode.loc.end.column = this.nameLoc.end.column;
            }
        }
    }
}
