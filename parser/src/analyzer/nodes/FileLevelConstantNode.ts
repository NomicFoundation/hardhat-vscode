import { FileLevelConstant } from "@solidity-parser/parser/dist/src/ast-types";

import { Location, FinderType, DocumentsAnalyzerTree, Node } from "./Node";

export class FileLevelConstantNode implements Node {
    type: string;
    uri: string;
    astNode: FileLevelConstant;

    nameLoc?: Location | undefined;

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

    addChild(child: Node): void {
        this.children.push(child);
    }

    setParent(parent: Node | undefined): void {
        this.parent = parent;
    }

    getParent(): Node | undefined {
        return this.parent;
    }

    accept(find: FinderType, documentsAnalyzerTree: DocumentsAnalyzerTree, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (parent) {
            this.setParent(parent);
        }

        if (this.astNode.typeName) {
            const typeNode = find(this.astNode.typeName, this.uri).accept(find, documentsAnalyzerTree, orphanNodes, this);
        
            this.addTypeNode(typeNode);
            typeNode.setDeclarationNode(this);

            this.updateLocationName(typeNode);
        }

        if (this.astNode.initialValue) {
            find(this.astNode.initialValue, this.uri).accept(find, documentsAnalyzerTree, orphanNodes, parent);
        }

        parent?.addChild(this);

        return this;
    }

    updateLocationName(typeNode: Node): void {
        // TO-DO: Need to improve location name when Franco Victorio add in FileLevelConstant isDeclaredConst and isImmutable variables
        if (this.astNode.loc && this.nameLoc && typeNode.astNode.range) {
            const diff = 1 + (+typeNode.astNode.range[1] - +typeNode.astNode.range[0]);

            this.nameLoc.start.column = this.astNode.loc.start.column + diff + 1;
            this.nameLoc.end.column = this.nameLoc.start.column + (this.getName()?.length || 0);

            if (this.astNode.loc.end.column < this.nameLoc.end.column) {
                this.astNode.loc.end.column = this.nameLoc.end.column;
            }
        }
    }
}
