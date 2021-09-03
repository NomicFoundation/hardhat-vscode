"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolidityNavigation = void 0;
const types_1 = require("@common/types");
const utils_1 = require("@common/utils");
class SolidityNavigation {
    constructor(analyzer) {
        this.analyzer = analyzer;
    }
    findDefinition(uri, position, analyzerTree) {
        const definitionNode = this.findNodeByPosition(uri, position, analyzerTree);
        if (definitionNode && definitionNode.astNode.loc) {
            return {
                uri: definitionNode.uri,
                range: utils_1.getRange(definitionNode.astNode.loc)
            };
        }
        return undefined;
    }
    findTypeDefinition(uri, position, analyzerTree) {
        const definitionNode = this.findNodeByPosition(uri, position, analyzerTree);
        if (!definitionNode) {
            return [];
        }
        return this.getHighlightLocations(definitionNode.getTypeNodes());
    }
    findReferences(uri, position, analyzerTree) {
        const highlightNodes = this.findHighlightNodes(uri, position, analyzerTree);
        return this.getHighlightLocations(highlightNodes);
    }
    findImplementation(uri, position, analyzerTree) {
        const highlightNodes = this.findHighlightNodes(uri, position, analyzerTree);
        const implementationNodes = [];
        for (const highlightNode of highlightNodes) {
            if (types_1.definitionNodeTypes.includes(highlightNode.type)) {
                implementationNodes.push(highlightNode);
            }
        }
        return this.getHighlightLocations(implementationNodes);
    }
    doRename(uri, document, position, newName, analyzerTree) {
        const highlightNodes = this.findHighlightNodes(uri, position, analyzerTree);
        const workspaceEdit = { changes: {} };
        highlightNodes.forEach(highlightNode => {
            if (highlightNode.nameLoc && workspaceEdit.changes) {
                if (workspaceEdit.changes && !workspaceEdit.changes[highlightNode.uri]) {
                    workspaceEdit.changes[highlightNode.uri] = [];
                }
                const range = utils_1.getRange(highlightNode.nameLoc);
                workspaceEdit.changes[highlightNode.uri].push(types_1.TextEdit.replace(range, newName));
                highlightNode.isAlive = false;
            }
        });
        return workspaceEdit;
    }
    getHighlightLocations(highlightNodes) {
        const locations = [];
        highlightNodes.forEach(highlightNode => {
            if (highlightNode.nameLoc) {
                locations.push({
                    uri: highlightNode.uri,
                    range: utils_1.getRange(highlightNode.nameLoc)
                });
            }
        });
        return locations;
    }
    findHighlightNodes(uri, position, analyzerTree) {
        const highlights = [];
        const node = this.findNodeByPosition(uri, position, analyzerTree);
        const nodeName = node === null || node === void 0 ? void 0 : node.getName();
        if (node && nodeName) {
            this.extractHighlightsFromNodeRecursive(nodeName, node, highlights);
        }
        return highlights;
    }
    findNodeByPosition(uri, position, analyzerTree) {
        const documentAnalyzer = this.analyzer.getDocumentAnalyzer(uri);
        return documentAnalyzer.searcher.findDefinitionNodeByPosition(uri, utils_1.getParserPositionFromVSCodePosition(position), analyzerTree);
    }
    extractHighlightsFromNodeRecursive(name, node, results, visitedNodes) {
        if (!visitedNodes) {
            visitedNodes = [];
        }
        if (visitedNodes.includes(node)) {
            return;
        }
        visitedNodes.push(node);
        if (name === node.getName() || name === node.getAliasName()) {
            results.push(node);
        }
        for (const child of node.children) {
            this.extractHighlightsFromNodeRecursive(name, child, results, visitedNodes);
        }
    }
}
exports.SolidityNavigation = SolidityNavigation;
//# sourceMappingURL=SolidityNavigation.js.map