"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NameValueExpressionNode = void 0;
const types_1 = require("@common/types");
class NameValueExpressionNode extends types_1.Node {
    constructor(nameValueExpression, uri, rootPath, documentsAnalyzer) {
        super(nameValueExpression, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = nameValueExpression;
        // TO-DO: Implement name location for rename
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
exports.NameValueExpressionNode = NameValueExpressionNode;
//# sourceMappingURL=NameValueExpressionNode.js.map