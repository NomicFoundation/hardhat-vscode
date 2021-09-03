"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElementaryTypeNameNode = void 0;
const types_1 = require("@common/types");
class ElementaryTypeNameNode extends types_1.Node {
    constructor(elementaryTypeName, uri, rootPath, documentsAnalyzer) {
        super(elementaryTypeName, uri, rootPath, documentsAnalyzer, elementaryTypeName.name);
        this.astNode = elementaryTypeName;
        // TO-DO: Implement name location for rename
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
exports.ElementaryTypeNameNode = ElementaryTypeNameNode;
//# sourceMappingURL=ElementaryTypeNameNode.js.map