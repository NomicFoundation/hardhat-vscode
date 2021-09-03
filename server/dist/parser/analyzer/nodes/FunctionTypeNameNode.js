"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionTypeNameNode = void 0;
const types_1 = require("@common/types");
class FunctionTypeNameNode extends types_1.Node {
    constructor(functionTypeName, uri, rootPath, documentsAnalyzer) {
        super(functionTypeName, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = functionTypeName;
        // TO-DO: Implement name location for rename
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
exports.FunctionTypeNameNode = FunctionTypeNameNode;
//# sourceMappingURL=FunctionTypeNameNode.js.map