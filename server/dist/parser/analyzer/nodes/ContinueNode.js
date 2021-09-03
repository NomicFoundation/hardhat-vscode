"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContinueNode = void 0;
const types_1 = require("@common/types");
class ContinueNode extends types_1.Node {
    constructor(astContinue, uri, rootPath, documentsAnalyzer) {
        super(astContinue, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = astContinue;
        // TO-DO: Implement name location for rename
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
exports.ContinueNode = ContinueNode;
//# sourceMappingURL=ContinueNode.js.map