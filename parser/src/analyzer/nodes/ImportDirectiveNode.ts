import * as fs from "fs";
import * as path from "path";
import { ImportDirective } from "@solidity-parser/parser/dist/src/ast-types";

import * as finder from "../finder";
import { findNodeModules } from "../utils";
import {
    Location,
    FinderType,
    DocumentsAnalyzerMap,
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

    isAlive = true;

    nameLoc?: Location | undefined;

    aliasName?: string | undefined;

    importNode: Node | undefined;
    aliasNodes: Node[] = [];

    expressionNode?: Node | undefined;
    declarationNode?: Node | undefined;

    connectionTypeRules: string[] = [];

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (importDirective: ImportDirective, uri: string) {
        this.type = importDirective.type;
        this.realURI = uri;

        this.uri = path.join(uri, "..", importDirective.path);

        // See if file exists
        if (!fs.existsSync(this.uri)) {
            const nodeModulesPath = findNodeModules(this.uri);

            if (nodeModulesPath) {
                this.uri = path.join(nodeModulesPath, importDirective.path);
            }
        }

        if (importDirective.pathLiteral && importDirective.pathLiteral.loc) {
            this.nameLoc = importDirective.pathLiteral.loc;
            this.nameLoc.end.column = (this.nameLoc?.end.column || 0) + importDirective.pathLiteral.value.length;
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

    addAliasNode(aliasNode: Node): void {
        this.aliasNodes.push(aliasNode);
    }

    getAliasNodes(): Node[] {
        return this.aliasNodes;
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

        if (!documentsAnalyzerTree[this.uri]) {
            documentsAnalyzerTree[this.uri] = { rootNode: undefined };
        }

        if (documentsAnalyzer[this.uri] && !documentsAnalyzerTree[this.uri].rootNode) {
            documentsAnalyzerTree[this.uri].rootNode = documentsAnalyzer[this.uri].analyze(documentsAnalyzer, documentsAnalyzerTree);

            // Analyze will change root node so we need to return root node after analyze
            const rootNode = documentsAnalyzerTree[this.realURI].rootNode;
            if (rootNode) {
                finder.setRoot(rootNode);
            }

            // We transfer orphan nodes from the imported file in case it imports ours and we have a circular dependency.
            // We need to do this since the current analysis is not yet complete so some exported nodes may miss finding a parent.
            // This way we have solved this problem.
            for (const importOrphanNode of documentsAnalyzer[this.uri].orphanNodes) {
                (documentsAnalyzerTree[this.uri].rootNode as SourceUnitNode).addImportNode(importOrphanNode);
                (documentsAnalyzerTree[this.realURI].rootNode as SourceUnitNode).addExportNode(importOrphanNode);
            }
        }

        const importNode = documentsAnalyzerTree[this.uri].rootNode;
        if (importNode && importNode.type === "SourceUnit" && importNode?.astNode.loc) {
            this.astNode.loc = importNode.astNode.loc;
            this.setImportNode(importNode);
        }

        const aliesNodes: Node[] = [];
        for (const symbolAliasesIdentifier of this.astNode.symbolAliasesIdentifiers || []) {
            const importedContractNode = find(symbolAliasesIdentifier[0], this.realURI).accept(find, documentsAnalyzer, documentsAnalyzerTree, orphanNodes, this);

            // Check if alias exist for importedContractNode
            if (symbolAliasesIdentifier[1]) {
                const importedContractAliasNode = find(symbolAliasesIdentifier[1], this.realURI).accept(find, documentsAnalyzer, documentsAnalyzerTree, orphanNodes, importedContractNode, this);
                importedContractAliasNode.setAliasName(importedContractNode.getName());

                aliesNodes.push(importedContractAliasNode);
            } else {
                // Set your name as an alias name
                importedContractNode.setAliasName(importedContractNode.getName());
                aliesNodes.push(importedContractNode);
            }
        }

        for (const aliesNode of aliesNodes) {
            this.addAliasNode(aliesNode);
        }

        parent?.addChild(this);

        return this;
    }
}
