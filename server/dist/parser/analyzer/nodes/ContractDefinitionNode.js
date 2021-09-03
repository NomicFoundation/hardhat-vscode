"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractDefinitionNode = void 0;
const utils_1 = require("@common/utils");
const types_1 = require("@common/types");
class ContractDefinitionNode extends types_1.ContractDefinitionNode {
    constructor(contractDefinition, uri, rootPath, documentsAnalyzer) {
        super(contractDefinition, uri, rootPath, documentsAnalyzer, contractDefinition.name);
        this.connectionTypeRules = ["Identifier", "UserDefinedTypeName", "FunctionCall", "UsingForDeclaration"];
        this.astNode = contractDefinition;
        if (contractDefinition.loc) {
            const escapePrefix = contractDefinition.kind === "abstract" ? "abstract contract ".length : contractDefinition.kind.length + 1;
            this.nameLoc = {
                start: {
                    line: contractDefinition.loc.start.line,
                    column: contractDefinition.loc.start.column + escapePrefix
                },
                end: {
                    line: contractDefinition.loc.start.line,
                    column: contractDefinition.loc.start.column + escapePrefix + contractDefinition.name.length
                }
            };
        }
        this.addTypeNode(this);
    }
    getKind() {
        return this.astNode.kind;
    }
    getTypeNodes() {
        return this.typeNodes;
    }
    getDefinitionNode() {
        return this;
    }
    accept(find, orphanNodes, parent, expression) {
        var _a;
        this.setExpressionNode(expression);
        const searcher = (_a = this.documentsAnalyzer[this.uri]) === null || _a === void 0 ? void 0 : _a.searcher;
        if (parent) {
            this.setParent(parent);
        }
        for (const baseContract of this.astNode.baseContracts) {
            const inheritanceNode = find(baseContract, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
            const inheritanceNodeDefinition = inheritanceNode.getDefinitionNode();
            if (inheritanceNodeDefinition && inheritanceNodeDefinition instanceof ContractDefinitionNode) {
                this.inheritanceNodes.push(inheritanceNodeDefinition);
            }
        }
        for (const subNode of this.astNode.subNodes) {
            find(subNode, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        }
        // Find parent for orphanNodes from this contract in inheritance Nodes 
        this.findParentForOrphanNodesInInheritanceNodes(orphanNodes);
        const rootNode = utils_1.findSourceUnitNode(parent);
        if (rootNode) {
            const exportNodes = new Array(...rootNode.getExportNodes());
            searcher === null || searcher === void 0 ? void 0 : searcher.findAndAddExportChildren(this, exportNodes);
        }
        searcher === null || searcher === void 0 ? void 0 : searcher.findAndAddChildren(this, orphanNodes, false);
        parent === null || parent === void 0 ? void 0 : parent.addChild(this);
        return this;
    }
    findParentForOrphanNodesInInheritanceNodes(orphanNodes) {
        var _a;
        const searcher = (_a = this.documentsAnalyzer[this.uri]) === null || _a === void 0 ? void 0 : _a.searcher;
        const newOrphanNodes = [];
        let orphanNode = orphanNodes.shift();
        while (orphanNode) {
            if (this.astNode.loc && orphanNode.astNode.loc &&
                this.astNode.loc.start.line <= orphanNode.astNode.loc.start.line &&
                this.astNode.loc.end.line >= orphanNode.astNode.loc.end.line) {
                const nodeParent = searcher === null || searcher === void 0 ? void 0 : searcher.findParent(orphanNode, this, true);
                if (nodeParent) {
                    orphanNode.addTypeNode(nodeParent);
                    orphanNode.setParent(nodeParent);
                    nodeParent === null || nodeParent === void 0 ? void 0 : nodeParent.addChild(orphanNode);
                }
                else {
                    newOrphanNodes.push(orphanNode);
                }
            }
            else {
                newOrphanNodes.push(orphanNode);
            }
            orphanNode = orphanNodes.shift();
        }
        // Return to orphanNodes array unhandled orphan nodes
        for (const newOrphanNode of newOrphanNodes) {
            orphanNodes.push(newOrphanNode);
        }
    }
}
exports.ContractDefinitionNode = ContractDefinitionNode;
//# sourceMappingURL=ContractDefinitionNode.js.map