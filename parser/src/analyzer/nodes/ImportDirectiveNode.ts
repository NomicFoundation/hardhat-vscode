import * as path from 'path';
import { ImportDirective } from "@solidity-parser/parser/dist/src/ast-types";

import {
    Location,
    FinderType,
    DocumentsAnalyzerTree,
    Node,
    SourceUnitNode,
    ImportDirectiveNode as IImportDirectiveNode
} from "./Node";

export class ImportDirectiveNode implements IImportDirectiveNode {
    type: string;
    realURI: string;
    uri: string;
    astNode: ImportDirective;

    nameLoc?: Location | undefined;

    importNode: Node | undefined;

    expressionNode?: Node | undefined;
    declarationNode?: Node | undefined;

    connectionTypeRules: string[] = [];

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (importDirective: ImportDirective, uri: string) {
        this.type = importDirective.type;
        this.realURI = uri;

        // TO-DO: Improve for dependencies path and loc
        this.uri = path.join(uri, '..', importDirective.path);
        
        if (importDirective.loc) {
            this.nameLoc = {
                start: {
                    line: importDirective.loc.start.line,
                    column: importDirective.loc.start.column + "import ".length
                },
                end: {
                    line: importDirective.loc.end.line,
                    column: importDirective.loc.end.column
                }
            };
        }

        this.astNode = importDirective;
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

    setImportNode(importNode: Node): void {
        this.importNode = importNode;
    }

    getImportNode(): Node | undefined {
        return this.importNode;
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
        return this.astNode.path;
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

        const importNode = documentsAnalyzerTree[this.uri];
        if (importNode && importNode.type === "SourceUnit" && importNode?.astNode.loc) {
            this.astNode.loc = importNode.astNode.loc;

            const sourceUintImportNode = importNode as SourceUnitNode;
            const sourceUintExportNodes = sourceUintImportNode.getExportNodes();

            for (let i = 0; i < sourceUintExportNodes.length; i++) {
                if (sourceUintExportNodes[i].uri === this.realURI) {
                    sourceUintExportNodes.splice(i, 1);
                }
            }

            this.setImportNode(sourceUintImportNode);
        }

        parent?.addChild(this);

        return this;
    }
}
