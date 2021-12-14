import * as path from "path";

import { resolveDependency } from "@analyzer/resolver";
import {
    ImportDirective, FinderType, DocumentsAnalyzerMap, Node,
    SourceUnitNode, ImportDirectiveNode as AbstractImportDirectiveNode
} from "@common/types";

export class ImportDirectiveNode extends AbstractImportDirectiveNode {
    realUri: string;

    uri: string;
    astNode: ImportDirective;

    constructor(importDirective: ImportDirective, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) {
        super(importDirective, uri, rootPath, documentsAnalyzer, importDirective.path);
        this.realUri = uri;

        try {
            this.uri = resolveDependency(path.resolve(this.realUri, ".."), this.rootPath, importDirective);
        } catch (err) {
            this.uri = '';
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

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        if (parent) {
            this.setParent(parent);
        }

        const documentAnalyzer = this.documentsAnalyzer[this.uri];
        if (documentAnalyzer && !documentAnalyzer.isAnalyzed) {
            documentAnalyzer.analyze(this.documentsAnalyzer);

            // Analyze will change root node so we need to return root node after analyze
            const rootNode = this.documentsAnalyzer[this.realUri]?.analyzerTree.tree;

            if (documentAnalyzer.isAnalyzed && rootNode) {
                // We transfer orphan nodes from the imported file in case it imports ours and we have a circular dependency.
                // We need to do this since the current analysis is not yet complete so some exported nodes may miss finding a parent.
                // This way we have solved this problem.
                for (const importOrphanNode of documentAnalyzer.orphanNodes) {
                    (documentAnalyzer.analyzerTree.tree as SourceUnitNode).addImportNode(importOrphanNode);
                    (rootNode as SourceUnitNode).addExportNode(importOrphanNode);
                }
            }
        }

        if (
            documentAnalyzer?.analyzerTree.tree.type === "SourceUnit" &&
            documentAnalyzer.analyzerTree.tree.astNode.loc
        ) {
            this.astNode.loc = documentAnalyzer.analyzerTree.tree.astNode.loc;
        }

        const aliesNodes: Node[] = [];
        for (const symbolAliasesIdentifier of this.astNode.symbolAliasesIdentifiers || []) {
            const importedContractNode = find(symbolAliasesIdentifier[0], this.realUri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);

            // Check if alias exist for importedContractNode
            if (symbolAliasesIdentifier[1]) {
                const importedContractAliasNode = find(symbolAliasesIdentifier[1], this.realUri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, importedContractNode, this);
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
