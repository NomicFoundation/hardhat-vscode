"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionDefinitionNode = void 0;
const utils_1 = require("@common/utils");
const types_1 = require("@common/types");
class FunctionDefinitionNode extends types_1.FunctionDefinitionNode {
    constructor(functionDefinition, uri, rootPath, documentsAnalyzer) {
        super(functionDefinition, uri, rootPath, documentsAnalyzer, functionDefinition.name || undefined);
        this.connectionTypeRules = ["FunctionCall"];
        this.astNode = functionDefinition;
        if (!functionDefinition.isConstructor && functionDefinition.loc && functionDefinition.name) {
            this.nameLoc = {
                start: {
                    line: functionDefinition.loc.start.line,
                    column: functionDefinition.loc.start.column + "function ".length
                },
                end: {
                    line: functionDefinition.loc.start.line,
                    column: functionDefinition.loc.start.column + "function ".length + functionDefinition.name.length
                }
            };
        }
    }
    getDefinitionNode() {
        return this;
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        if (parent) {
            this.setParent(parent);
            const rootNode = utils_1.findSourceUnitNode(parent);
            if (rootNode) {
                const exportNodes = new Array(...rootNode.getExportNodes());
                this.findChildren(exportNodes);
            }
        }
        this.findChildren(orphanNodes);
        for (const override of this.astNode.override || []) {
            find(override, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        }
        for (const param of this.astNode.parameters) {
            find(param, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        }
        for (const returnParam of this.astNode.returnParameters || []) {
            const typeNode = find(returnParam, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
            this.addTypeNode(typeNode);
        }
        for (const modifier of this.astNode.modifiers || []) {
            const typeNode = find(modifier, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
            this.addTypeNode(typeNode);
        }
        if (this.astNode.body) {
            find(this.astNode.body, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        }
        if ((parent === null || parent === void 0 ? void 0 : parent.type) === "ContractDefinition") {
            const inheritanceNodes = parent.getInheritanceNodes();
            for (const inheritanceNode of inheritanceNodes) {
                for (const child of inheritanceNode.children) {
                    if (child.type === this.type && child.getName() === this.getName()) {
                        this.addChild(child);
                        child.addChild(this);
                    }
                }
            }
        }
        parent === null || parent === void 0 ? void 0 : parent.addChild(this);
        return this;
    }
    findChildren(orphanNodes) {
        var _a;
        const newOrphanNodes = [];
        const parent = this.getParent();
        let orphanNode = orphanNodes.shift();
        while (orphanNode) {
            if (this.getName() === orphanNode.getName() && parent &&
                utils_1.isNodeShadowedByNode(orphanNode, parent) &&
                this.connectionTypeRules.includes(((_a = orphanNode.getExpressionNode()) === null || _a === void 0 ? void 0 : _a.type) || "") &&
                orphanNode.type !== "MemberAccess") {
                orphanNode.addTypeNode(this);
                orphanNode.setParent(this);
                this.addChild(orphanNode);
            }
            else {
                newOrphanNodes.push(orphanNode);
            }
            orphanNode = orphanNodes.shift();
        }
        for (const newOrphanNode of newOrphanNodes) {
            orphanNodes.push(newOrphanNode);
        }
    }
}
exports.FunctionDefinitionNode = FunctionDefinitionNode;
//# sourceMappingURL=FunctionDefinitionNode.js.map