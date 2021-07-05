import * as fs from "fs";
import * as path from "path";

import * as cache from "@common/cache";
import * as finder from "@common/finder";
import { findNodeModules } from "@common/utils";
import {
    ImportDirective,
    FinderType,
    Node,
    SourceUnitNode,
    ImportDirectiveNode as AbstractImportDirectiveNode
} from "@common/types";

export class ImportDirectiveNode extends AbstractImportDirectiveNode {
    realUri: string;

    uri: string;
    astNode: ImportDirective;

    constructor (importDirective: ImportDirective, uri: string, rootPath: string) {
        super(importDirective, uri, rootPath);
        this.realUri = uri;
        this.uri = path.join(uri, "..", importDirective.path);

        // See if file exists
        if (!fs.existsSync(this.uri)) {
            const nodeModulesPath = findNodeModules(this.uri, this.rootPath);

            if (nodeModulesPath) {
                this.uri = path.join(nodeModulesPath, importDirective.path);
            }
        }

        if (importDirective.pathLiteral && importDirective.pathLiteral.loc) {
            this.nameLoc = importDirective.pathLiteral.loc;
            this.nameLoc.end.column = (this.nameLoc?.end.column || 0) + importDirective.pathLiteral.value.length + 1;
        }

        this.astNode = importDirective;
    }

    getDefinitionNode(): Node | undefined {
        return this;
    }

    getName(): string | undefined {
        return this.astNode.path;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (parent) {
            this.setParent(parent);
        }

        const documentAnalyzer = cache.getDocumentAnalyzer(this.uri);

        if (documentAnalyzer && !documentAnalyzer.analyzerTree) {
            documentAnalyzer.analyze();

            // Analyze will change root node so we need to return root node after analyze
            const rootNode = cache.getDocumentAnalyzer(this.realUri)?.analyzerTree;
            if (rootNode) {
                finder.setRoot(rootNode);
            }

            if (documentAnalyzer.analyzerTree && rootNode) {
                // We transfer orphan nodes from the imported file in case it imports ours and we have a circular dependency.
                // We need to do this since the current analysis is not yet complete so some exported nodes may miss finding a parent.
                // This way we have solved this problem.
                for (const importOrphanNode of documentAnalyzer.orphanNodes) {
                    (documentAnalyzer.analyzerTree as SourceUnitNode).addImportNode(importOrphanNode);
                    (rootNode as SourceUnitNode).addExportNode(importOrphanNode);
                }
            }
        }

        if (
            documentAnalyzer?.analyzerTree &&
            documentAnalyzer.analyzerTree.type === "SourceUnit" &&
            documentAnalyzer.analyzerTree.astNode.loc
        ) {
            this.astNode.loc = documentAnalyzer.analyzerTree.astNode.loc;
        }

        const aliesNodes: Node[] = [];
        for (const symbolAliasesIdentifier of this.astNode.symbolAliasesIdentifiers || []) {
            const importedContractNode = find(symbolAliasesIdentifier[0], this.realUri, this.rootPath).accept(find, orphanNodes, this);

            // Check if alias exist for importedContractNode
            if (symbolAliasesIdentifier[1]) {
                const importedContractAliasNode = find(symbolAliasesIdentifier[1], this.realUri, this.rootPath).accept(find, orphanNodes, importedContractNode, this);
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
