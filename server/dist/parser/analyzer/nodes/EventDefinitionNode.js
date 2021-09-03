"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventDefinitionNode = void 0;
const utils_1 = require("@common/utils");
const types_1 = require("@common/types");
class EventDefinitionNode extends types_1.Node {
    constructor(eventDefinition, uri, rootPath, documentsAnalyzer) {
        var _a;
        super(eventDefinition, uri, rootPath, documentsAnalyzer, eventDefinition.name);
        this.connectionTypeRules = ["EmitStatement"];
        this.astNode = eventDefinition;
        if (eventDefinition.loc && eventDefinition.name) {
            this.nameLoc = {
                start: {
                    line: eventDefinition.loc.start.line,
                    column: eventDefinition.loc.start.column + "event ".length
                },
                end: {
                    line: eventDefinition.loc.start.line,
                    column: eventDefinition.loc.start.column + "event ".length + (((_a = this.getName()) === null || _a === void 0 ? void 0 : _a.length) || 0)
                }
            };
        }
    }
    getTypeNodes() {
        return this.typeNodes;
    }
    getDefinitionNode() {
        return this;
    }
    accept(find, orphanNodes, parent, expression) {
        var _a;
        this.setExpressionNode(expression);
        const searcher = (_a = this.documentsAnalyzer[this.uri]) === null || _a === void 0 ? void 0 : _a.searcher;
        if (parent) {
            this.setParent(parent);
        }
        // for (const parameter of this.astNode.parameters) {
        //     find(parameter, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);
        // }
        const rootNode = utils_1.findSourceUnitNode(parent);
        if (rootNode) {
            const exportNodes = new Array(...rootNode.getExportNodes());
            searcher === null || searcher === void 0 ? void 0 : searcher.findAndAddExportChildren(this, exportNodes);
        }
        searcher === null || searcher === void 0 ? void 0 : searcher.findAndAddChildren(this, orphanNodes);
        parent === null || parent === void 0 ? void 0 : parent.addChild(this);
        return this;
    }
}
exports.EventDefinitionNode = EventDefinitionNode;
//# sourceMappingURL=EventDefinitionNode.js.map