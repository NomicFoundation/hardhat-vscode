"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportDirectiveNode = void 0;
const fs = require("fs");
const path = require("path");
const utils_1 = require("@common/utils");
const types_1 = require("@common/types");
class ImportDirectiveNode extends types_1.ImportDirectiveNode {
    constructor(importDirective, uri, rootPath, documentsAnalyzer) {
        var _a;
        super(importDirective, uri, rootPath, documentsAnalyzer, importDirective.path);
        this.realUri = uri;
        this.uri = path.join(uri, "..", importDirective.path);
        // See if file exists
        if (!fs.existsSync(this.uri)) {
            const nodeModulesPath = utils_1.findNodeModules(this.uri, this.rootPath);
            if (nodeModulesPath) {
                this.uri = path.join(nodeModulesPath, importDirective.path);
            }
        }
        if (importDirective.pathLiteral && importDirective.pathLiteral.loc) {
            this.nameLoc = importDirective.pathLiteral.loc;
            this.nameLoc.end.column = (((_a = this.nameLoc) === null || _a === void 0 ? void 0 : _a.end.column) || 0) + importDirective.pathLiteral.value.length + 1;
        }
        this.astNode = importDirective;
    }
    getDefinitionNode() {
        return this;
    }
    accept(find, orphanNodes, parent, expression) {
        var _a;
        this.setExpressionNode(expression);
        if (parent) {
            this.setParent(parent);
        }
        const documentAnalyzer = this.documentsAnalyzer[this.uri];
        if (documentAnalyzer && !documentAnalyzer.isAnalyzed) {
            documentAnalyzer.analyze(this.documentsAnalyzer);
            // Analyze will change root node so we need to return root node after analyze
            const rootNode = (_a = this.documentsAnalyzer[this.realUri]) === null || _a === void 0 ? void 0 : _a.analyzerTree.tree;
            if (documentAnalyzer.isAnalyzed && rootNode) {
                // We transfer orphan nodes from the imported file in case it imports ours and we have a circular dependency.
                // We need to do this since the current analysis is not yet complete so some exported nodes may miss finding a parent.
                // This way we have solved this problem.
                for (const importOrphanNode of documentAnalyzer.orphanNodes) {
                    documentAnalyzer.analyzerTree.tree.addImportNode(importOrphanNode);
                    rootNode.addExportNode(importOrphanNode);
                }
            }
        }
        if ((documentAnalyzer === null || documentAnalyzer === void 0 ? void 0 : documentAnalyzer.analyzerTree.tree.type) === "SourceUnit" &&
            documentAnalyzer.analyzerTree.tree.astNode.loc) {
            this.astNode.loc = documentAnalyzer.analyzerTree.tree.astNode.loc;
        }
        const aliesNodes = [];
        for (const symbolAliasesIdentifier of this.astNode.symbolAliasesIdentifiers || []) {
            const importedContractNode = find(symbolAliasesIdentifier[0], this.realUri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
            // Check if alias exist for importedContractNode
            if (symbolAliasesIdentifier[1]) {
                const importedContractAliasNode = find(symbolAliasesIdentifier[1], this.realUri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, importedContractNode, this);
                importedContractAliasNode.setAliasName(importedContractNode.getName());
                aliesNodes.push(importedContractAliasNode);
            }
            else {
                // Set your name as an alias name
                importedContractNode.setAliasName(importedContractNode.getName());
                aliesNodes.push(importedContractNode);
            }
        }
        for (const aliesNode of aliesNodes) {
            this.addAliasNode(aliesNode);
        }
        parent === null || parent === void 0 ? void 0 : parent.addChild(this);
        return this;
    }
}
exports.ImportDirectiveNode = ImportDirectiveNode;
//# sourceMappingURL=ImportDirectiveNode.js.map