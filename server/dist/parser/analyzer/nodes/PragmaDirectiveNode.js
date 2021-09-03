"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PragmaDirectiveNode = void 0;
const types_1 = require("@common/types");
class PragmaDirectiveNode extends types_1.Node {
    constructor(pragmaDirective, uri, rootPath, documentsAnalyzer) {
        super(pragmaDirective, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = pragmaDirective;
        // TO-DO: Implement name location for rename
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
exports.PragmaDirectiveNode = PragmaDirectiveNode;
//# sourceMappingURL=PragmaDirectiveNode.js.map