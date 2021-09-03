"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnumValueNode = void 0;
const types_1 = require("@common/types");
class EnumValueNode extends types_1.Node {
    constructor(enumValue, uri, rootPath, documentsAnalyzer) {
        super(enumValue, uri, rootPath, documentsAnalyzer, enumValue.name);
        this.connectionTypeRules = ["MemberAccess"];
        if (enumValue.loc) {
            // Bug in solidity parser doesn't give exact end location
            enumValue.loc.end.column = enumValue.loc.end.column + enumValue.name.length;
            this.nameLoc = JSON.parse(JSON.stringify(enumValue.loc));
        }
        this.astNode = enumValue;
    }
    getDefinitionNode() {
        return this;
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        if (parent) {
            this.setParent(parent);
        }
        parent === null || parent === void 0 ? void 0 : parent.addChild(this);
        return this;
    }
}
exports.EnumValueNode = EnumValueNode;
//# sourceMappingURL=EnumValueNode.js.map