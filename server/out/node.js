"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Node = void 0;
class Node {
    constructor(uri, loc, type, name, parent) {
        this.children = [];
        this.addChild = (child) => {
            this.children.push(child);
        };
        this.setParent = (parent) => {
            this.parent = parent;
        };
        this.uri = uri;
        this.loc = loc;
        this.loc.start.line = loc.start.line - 1;
        this.loc.end.line = loc.end.line - 1;
        this.type = type;
        this.name = name;
        this.parent = parent;
    }
}
exports.Node = Node;
//# sourceMappingURL=node.js.map