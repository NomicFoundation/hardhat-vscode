"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NameValueListNode = void 0;
const types_1 = require("@common/types");
class NameValueListNode extends types_1.Node {
    constructor(nameValueList, uri, rootPath, documentsAnalyzer) {
        super(nameValueList, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = nameValueList;
        // TO-DO: Implement name location for rename
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
exports.NameValueListNode = NameValueListNode;
//# sourceMappingURL=NameValueListNode.js.map