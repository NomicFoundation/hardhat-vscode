"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabelDefinitionNode = void 0;
const types_1 = require("@common/types");
class LabelDefinitionNode extends types_1.Node {
    constructor(labelDefinition, uri, rootPath, documentsAnalyzer) {
        super(labelDefinition, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = labelDefinition;
        // TO-DO: Implement name location for rename
    }
    getTypeNodes() {
        return this.typeNodes;
    }
    getDefinitionNode() {
        return this;
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
exports.LabelDefinitionNode = LabelDefinitionNode;
//# sourceMappingURL=LabelDefinitionNode.js.map