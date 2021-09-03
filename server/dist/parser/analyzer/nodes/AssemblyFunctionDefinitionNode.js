"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssemblyFunctionDefinitionNode = void 0;
const utils_1 = require("@common/utils");
const types_1 = require("@common/types");
class AssemblyFunctionDefinitionNode extends types_1.Node {
    constructor(assemblyFunctionDefinition, uri, rootPath, documentsAnalyzer) {
        super(assemblyFunctionDefinition, uri, rootPath, documentsAnalyzer, assemblyFunctionDefinition.name);
        this.connectionTypeRules = ["AssemblyCall"];
        this.astNode = assemblyFunctionDefinition;
        if (assemblyFunctionDefinition.loc && assemblyFunctionDefinition.name) {
            this.nameLoc = {
                start: {
                    line: assemblyFunctionDefinition.loc.start.line,
                    column: assemblyFunctionDefinition.loc.start.column + "function ".length
                },
                end: {
                    line: assemblyFunctionDefinition.loc.start.line,
                    column: assemblyFunctionDefinition.loc.start.column + "function ".length + assemblyFunctionDefinition.name.length
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
        }
        this.findChildren(orphanNodes);
        for (const argument of this.astNode.arguments) {
            find(argument, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        }
        for (const returnArgument of this.astNode.returnArguments) {
            const typeNode = find(returnArgument, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
            this.addTypeNode(typeNode);
        }
        find(this.astNode.body, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
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
exports.AssemblyFunctionDefinitionNode = AssemblyFunctionDefinitionNode;
//# sourceMappingURL=AssemblyFunctionDefinitionNode.js.map