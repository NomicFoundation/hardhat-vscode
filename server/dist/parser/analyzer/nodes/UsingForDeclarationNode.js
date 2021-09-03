"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsingForDeclarationNode = void 0;
const types_1 = require("@common/types");
class UsingForDeclarationNode extends types_1.Node {
    constructor(usingForDeclaration, uri, rootPath, documentsAnalyzer) {
        var _a;
        super(usingForDeclaration, uri, rootPath, documentsAnalyzer, usingForDeclaration.libraryName);
        this.connectionTypeRules = ["ContractDefinition"];
        this.astNode = usingForDeclaration;
        if (usingForDeclaration.loc && usingForDeclaration.libraryName) {
            this.nameLoc = {
                start: {
                    line: usingForDeclaration.loc.start.line,
                    column: usingForDeclaration.loc.start.column + "using ".length
                },
                end: {
                    line: usingForDeclaration.loc.start.line,
                    column: usingForDeclaration.loc.start.column + "using ".length + (((_a = this.getName()) === null || _a === void 0 ? void 0 : _a.length) || 0)
                }
            };
        }
    }
    accept(find, orphanNodes, parent, expression) {
        var _a;
        this.setExpressionNode(expression);
        if (this.astNode.typeName) {
            find(this.astNode.typeName, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);
        }
        if (parent) {
            const searcher = (_a = this.documentsAnalyzer[this.uri]) === null || _a === void 0 ? void 0 : _a.searcher;
            const identifierParent = searcher === null || searcher === void 0 ? void 0 : searcher.findParent(this, parent);
            if (identifierParent) {
                this.addTypeNode(identifierParent);
                this.setParent(identifierParent);
                identifierParent === null || identifierParent === void 0 ? void 0 : identifierParent.addChild(this);
                return this;
            }
        }
        orphanNodes.push(this);
        return this;
    }
}
exports.UsingForDeclarationNode = UsingForDeclarationNode;
//# sourceMappingURL=UsingForDeclarationNode.js.map