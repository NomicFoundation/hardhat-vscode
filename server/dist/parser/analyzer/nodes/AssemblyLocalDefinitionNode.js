"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssemblyLocalDefinitionNode = void 0;
const types_1 = require("@common/types");
class AssemblyLocalDefinitionNode extends types_1.Node {
    constructor(assemblyLocalDefinition, uri, rootPath, documentsAnalyzer, parent, identifierNode) {
        super(assemblyLocalDefinition, uri, rootPath, documentsAnalyzer, undefined);
        this.connectionTypeRules = ["AssemblyCall", "Identifier"];
        this.astNode = assemblyLocalDefinition;
        if (parent && identifierNode) {
            this.setParent(parent);
            this.nameLoc = identifierNode.nameLoc;
            this.name = identifierNode.getName();
            parent.addChild(this);
        }
    }
    getTypeNodes() {
        return this.typeNodes;
    }
    getDefinitionNode() {
        return this;
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        for (const name of this.astNode.names || []) {
            const identifierNode = find(name, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this, this);
            new AssemblyLocalDefinitionNode(this.astNode, identifierNode.uri, identifierNode.rootPath, identifierNode.documentsAnalyzer, parent, identifierNode);
        }
        if (this.astNode.expression) {
            find(this.astNode.expression, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);
        }
        return this;
    }
}
exports.AssemblyLocalDefinitionNode = AssemblyLocalDefinitionNode;
//# sourceMappingURL=AssemblyLocalDefinitionNode.js.map