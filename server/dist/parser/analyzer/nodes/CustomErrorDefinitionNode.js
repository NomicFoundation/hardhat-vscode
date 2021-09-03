"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomErrorDefinitionNode = void 0;
const types_1 = require("@common/types");
class CustomErrorDefinitionNode extends types_1.Node {
    constructor(customErrorDefinition, uri, rootPath, documentsAnalyzer) {
        super(customErrorDefinition, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = customErrorDefinition;
        // TO-DO: Implement name location for rename
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
exports.CustomErrorDefinitionNode = CustomErrorDefinitionNode;
//# sourceMappingURL=CustomErrorDefinitionNode.js.map