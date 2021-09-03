"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentifierNode = void 0;
const utils_1 = require("@common/utils");
const types_1 = require("@common/types");
class IdentifierNode extends types_1.Node {
    constructor(identifier, uri, rootPath, documentsAnalyzer) {
        super(identifier, uri, rootPath, documentsAnalyzer, identifier.name);
        if (identifier.loc && identifier.range) {
            // Bug in solidity parser doesn't give exact end location
            identifier.loc.end.column = identifier.loc.end.column + (identifier.range[1] - identifier.range[0]) + 1;
            this.nameLoc = JSON.parse(JSON.stringify(identifier.loc));
        }
        this.astNode = identifier;
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
        var _a;
        this.setExpressionNode(expression);
        if ((expression === null || expression === void 0 ? void 0 : expression.type) === "AssemblyLocalDefinition") {
            return this;
        }
        if ((expression === null || expression === void 0 ? void 0 : expression.type) === "ImportDirective" && parent) {
            const definitionNode = parent.getDefinitionNode();
            if (definitionNode) {
                this.addTypeNode(definitionNode);
                this.setParent(definitionNode);
                definitionNode === null || definitionNode === void 0 ? void 0 : definitionNode.addChild(this);
                return this;
            }
        }
        if (parent) {
            const searcher = (_a = this.documentsAnalyzer[this.uri]) === null || _a === void 0 ? void 0 : _a.searcher;
            const identifierParent = searcher === null || searcher === void 0 ? void 0 : searcher.findParent(this, parent);
            if (identifierParent) {
                this.addTypeNode(identifierParent);
                this.setParent(identifierParent);
                identifierParent === null || identifierParent === void 0 ? void 0 : identifierParent.addChild(this);
                return this;
            }
        }
        orphanNodes.push(this);
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
                    return;
                }
            }
        }
    }
}
exports.IdentifierNode = IdentifierNode;
//# sourceMappingURL=IdentifierNode.js.map