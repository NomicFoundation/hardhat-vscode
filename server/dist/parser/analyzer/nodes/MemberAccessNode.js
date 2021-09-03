"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberAccessNode = void 0;
const utils_1 = require("@common/utils");
const types_1 = require("@common/types");
class MemberAccessNode extends types_1.MemberAccessNode {
    constructor(memberAccess, uri, rootPath, documentsAnalyzer) {
        super(memberAccess, uri, rootPath, documentsAnalyzer, memberAccess.memberName);
        if (memberAccess.loc) {
            // Bug in solidity parser doesn't give exact locations
            memberAccess.loc.start.line = memberAccess.loc.end.line;
            memberAccess.loc.start.column = memberAccess.loc.end.column;
            memberAccess.loc.end.column = memberAccess.loc.end.column + (memberAccess.memberName.length || 1);
            this.nameLoc = JSON.parse(JSON.stringify(memberAccess.loc));
        }
        this.astNode = memberAccess;
    }
    setParent(parent) {
        this.parent = parent;
        let expressionNode = this.getExpressionNode();
        if (parent && expressionNode && types_1.expressionNodeTypes.includes(expressionNode.type)) {
            if (expressionNode.type !== "MemberAccess") {
                expressionNode = expressionNode.getExpressionNode();
            }
            if (expressionNode && expressionNode.type === "MemberAccess") {
                const definitionTypes = parent.getTypeNodes();
                this.findMemberAccessParent(expressionNode, definitionTypes);
            }
        }
    }
    accept(find, orphanNodes, parent, expression) {
        var _a, _b;
        this.setExpressionNode(expression);
        const expressionNode = find(this.astNode.expression, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent, this);
        this.setPreviousMemberAccessNode(expressionNode);
        if (!expressionNode.parent) {
            const definitionTypes = expressionNode.getTypeNodes();
            const handled = this.findMemberAccessParent(expressionNode, definitionTypes);
            if (handled) {
                return handled;
            }
        }
        // The Identifier name "super" is reserved, so we will try to find the parent for this Node in inheritance Nodes
        if (expressionNode.getName() === "super" && expressionNode.type === "Identifier") {
            let contractDefinitionNode = parent;
            while (contractDefinitionNode && contractDefinitionNode.type !== "ContractDefinition") {
                contractDefinitionNode = contractDefinitionNode.getParent();
            }
            const searcher = (_a = this.documentsAnalyzer[this.uri]) === null || _a === void 0 ? void 0 : _a.searcher;
            const inheritanceNodes = contractDefinitionNode.getInheritanceNodes();
            for (let i = inheritanceNodes.length - 1; i >= 0; i--) {
                const inheritanceNode = inheritanceNodes[i];
                const memberAccessParent = searcher === null || searcher === void 0 ? void 0 : searcher.findParent(this, inheritanceNode, true);
                if (memberAccessParent) {
                    this.addTypeNode(memberAccessParent);
                    this.setParent(memberAccessParent);
                    memberAccessParent === null || memberAccessParent === void 0 ? void 0 : memberAccessParent.addChild(this);
                    return this;
                }
            }
        }
        // The Identifier name "this" is reserved, so we will try to find the parent for this Node in contract first layer
        if (expressionNode.getName() === "this" && expressionNode.type === "Identifier") {
            let contractDefinitionNode = parent;
            while (contractDefinitionNode && contractDefinitionNode.type !== "ContractDefinition") {
                contractDefinitionNode = contractDefinitionNode.getParent();
            }
            const searcher = (_b = this.documentsAnalyzer[this.uri]) === null || _b === void 0 ? void 0 : _b.searcher;
            const memberAccessParent = searcher === null || searcher === void 0 ? void 0 : searcher.findParent(this, contractDefinitionNode, true);
            if (memberAccessParent) {
                this.addTypeNode(memberAccessParent);
                this.setParent(memberAccessParent);
                memberAccessParent === null || memberAccessParent === void 0 ? void 0 : memberAccessParent.addChild(this);
                return this;
            }
        }
        // Never add MemberAccessNode to orphanNodes because it is handled via expression
        return this;
    }
    findMemberAccessParent(expressionNode, definitionTypes) {
        var _a;
        for (const definitionType of definitionTypes) {
            for (const definitionChild of definitionType.children) {
                if (utils_1.isNodeConnectable(definitionChild, expressionNode)) {
                    expressionNode.addTypeNode(definitionChild);
                    expressionNode.setParent(definitionChild);
                    definitionChild === null || definitionChild === void 0 ? void 0 : definitionChild.addChild(expressionNode);
                    // If the parent uri and node uri are not the same, add the node to the exportNode field
                    if (definitionChild && definitionChild.uri !== expressionNode.uri) {
                        const exportRootNode = utils_1.findSourceUnitNode(definitionChild);
                        const importRootNode = utils_1.findSourceUnitNode((_a = this.documentsAnalyzer[this.uri]) === null || _a === void 0 ? void 0 : _a.analyzerTree.tree);
                        if (exportRootNode) {
                            exportRootNode.addExportNode(expressionNode);
                        }
                        if (importRootNode) {
                            importRootNode.addImportNode(expressionNode);
                        }
                    }
                    return this;
                }
            }
        }
        return undefined;
    }
}
exports.MemberAccessNode = MemberAccessNode;
//# sourceMappingURL=MemberAccessNode.js.map