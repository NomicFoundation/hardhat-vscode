"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserDefinedTypeNameNode = void 0;
const utils_1 = require("@common/utils");
const types_1 = require("@common/types");
class UserDefinedTypeNameNode extends types_1.Node {
    constructor(userDefinedTypeName, uri, rootPath, documentsAnalyzer) {
        super(userDefinedTypeName, uri, rootPath, documentsAnalyzer, userDefinedTypeName.namePath);
        if (userDefinedTypeName.loc) {
            // Bug in solidity parser doesn't give exact end location
            userDefinedTypeName.loc.end.column = userDefinedTypeName.loc.end.column + userDefinedTypeName.namePath.length;
            this.nameLoc = JSON.parse(JSON.stringify(userDefinedTypeName.loc));
        }
        this.astNode = userDefinedTypeName;
    }
    setParent(parent) {
        this.parent = parent;
        const declarationNode = this.getDeclarationNode();
        for (const child of (declarationNode === null || declarationNode === void 0 ? void 0 : declarationNode.children) || []) {
            const expressionNode = child.getExpressionNode();
            if (parent && expressionNode && expressionNode.type === "MemberAccess") {
                const definitionTypes = parent.getTypeNodes();
                this.findMemberAccessParent(expressionNode, definitionTypes);
            }
        }
    }
    accept(find, orphanNodes, parent, expression) {
        var _a;
        this.setExpressionNode(expression);
        if (parent) {
            const searcher = (_a = this.documentsAnalyzer[this.uri]) === null || _a === void 0 ? void 0 : _a.searcher;
            const definitionParent = searcher === null || searcher === void 0 ? void 0 : searcher.findParent(this, parent);
            if (definitionParent) {
                this.addTypeNode(definitionParent);
                this.setParent(definitionParent);
                definitionParent === null || definitionParent === void 0 ? void 0 : definitionParent.addChild(this);
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
exports.UserDefinedTypeNameNode = UserDefinedTypeNameNode;
//# sourceMappingURL=UserDefinedTypeNameNode.js.map