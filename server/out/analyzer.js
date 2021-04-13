"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Analyzer = void 0;
const node_1 = require("./node");
const utils_1 = require("./utils");
class Analyzer {
    constructor(uri, ast) {
        this.orphanNodes = [];
        this.analyzeSourceUnit = (ast) => {
            this.analyzerTree = new node_1.Node(this.uri, ast.loc, ast.type);
            for (const child of ast.children) {
                switch (child.type) {
                    case 'ContractDefinition':
                        this.analyzeContractDefinition(this.analyzerTree, child);
                        break;
                    default:
                        break;
                }
            }
        };
        this.analyzeContractDefinition = (parent, ast) => {
            var _a;
            const node = new node_1.Node(this.uri, ast.loc, ast.type, ast.name, parent);
            for (const subNode of ast.subNodes) {
                switch (subNode.type) {
                    case 'StateVariableDeclaration':
                        this.analyzeStateVariableDeclaration(node, subNode);
                        break;
                    case 'FunctionDefinition':
                        this.analyzeFunctionDefinition(node, subNode);
                        break;
                    case 'StructDefinition':
                        this.analyzeStructDefinition(node, subNode);
                        break;
                    default:
                        break;
                }
            }
            (_a = this.analyzerTree) === null || _a === void 0 ? void 0 : _a.addChild(node);
        };
        this.analyzeStateVariableDeclaration = (parent, ast) => {
            for (const variable of ast.variables) {
                // Bug in solidity parser does't give the exact location end
                const newLoc = variable.loc;
                newLoc.end.column = newLoc.start.column + variable.name.length;
                const node = new node_1.Node(this.uri, newLoc, variable.type, variable.name, parent);
                parent.addChild(node);
            }
        };
        this.analyzeFunctionDefinition = (parent, ast) => {
            // const newLoc = <Location><unknown>ast.loc;
            // // Find function name location
            // if (ast.name) {
            //     newLoc.start.column = newLoc.start.column + "function ".length;
            //     newLoc.end.line = newLoc.start.line;
            //     newLoc.end.column = newLoc.start.column + ast.name.length;
            // }
            const functionDefinitionNode = new node_1.Node(this.uri, ast.loc, ast.type, ast.name, parent);
            for (const parameter of ast.parameters) {
                // Bug in solidity parser does't give the exact location start & end
                const newLoc = parameter.loc;
                newLoc.start.line = newLoc.end.line;
                newLoc.start.column = newLoc.end.column;
                newLoc.end.column = newLoc.end.column + parameter.name.length;
                const parameterNode = new node_1.Node(this.uri, newLoc, parameter.type, parameter.name, functionDefinitionNode);
                functionDefinitionNode.addChild(parameterNode);
            }
            if (ast.body) {
                for (const statement of ast.body.statements) {
                    switch (statement.type) {
                        case "ExpressionStatement":
                            this.analyzeExpressionStatement(statement);
                            break;
                        case "ReturnStatement":
                            this.analyzeReturnStatement(statement);
                            break;
                        default:
                            break;
                    }
                }
            }
            parent.addChild(functionDefinitionNode);
        };
        this.analyzeStructDefinition = (parent, ast) => {
            const structDefinitionNode = new node_1.Node(this.uri, ast.loc, ast.type, ast.name, parent);
            for (const statement of ast.members) {
                switch (statement.type) {
                    case "VariableDeclaration":
                        this.analyzeVariableDeclaration(structDefinitionNode, statement);
                        break;
                    default:
                        break;
                }
            }
            parent.addChild(structDefinitionNode);
        };
        this.analyzeVariableDeclaration = (parent, ast) => {
            const newLoc = ast.loc;
            newLoc.start.line = newLoc.end.line;
            newLoc.start.column = newLoc.end.column;
            newLoc.end.column = newLoc.end.column + ast.name.length;
            const variableDeclarationNode = new node_1.Node(this.uri, newLoc, ast.type, ast.name, parent);
            switch (ast.typeName.type) {
                case "UserDefinedTypeName":
                    this.analyzeUserDefinedTypeName(ast.typeName);
                    break;
                default:
                    break;
            }
            parent.addChild(variableDeclarationNode);
        };
        this.analyzeUserDefinedTypeName = (ast) => {
            const statementParent = this.findParent(ast.namePath);
            // Bug in solidity parser does't give the exact location end
            const newLoc = ast.loc;
            newLoc.end.column = newLoc.start.column + ast.namePath.length;
            const node = new node_1.Node(this.uri, newLoc, ast.type, ast.namePath);
            if (statementParent) {
                node.setParent(statementParent);
                statementParent.addChild(node);
                return;
            }
            this.orphanNodes.push(node);
        };
        this.analyzeExpressionStatement = (ast) => {
            switch (ast.expression.type) {
                case "BinaryOperation":
                    this.analyzeBinaryOperation(ast.expression);
                    break;
                case "IndexAccess":
                    this.analyzeIndexAccess(ast.expression);
                    break;
                default:
                    break;
            }
        };
        this.analyzeReturnStatement = (ast) => {
            var _a;
            switch ((_a = ast.expression) === null || _a === void 0 ? void 0 : _a.type) {
                case "BinaryOperation":
                    this.analyzeBinaryOperation(ast.expression);
                    break;
                case "IndexAccess":
                    this.analyzeIndexAccess(ast.expression);
                    break;
                default:
                    break;
            }
        };
        this.analyzeBinaryOperation = (ast) => {
            switch (ast.left.type) {
                case "IndexAccess":
                    this.analyzeIndexAccess(ast.left);
                    break;
                case "Identifier":
                    this.analyzeIdentifier(ast.left);
                    break;
                default:
                    break;
            }
            switch (ast.right.type) {
                case "IndexAccess":
                    this.analyzeIndexAccess(ast.right);
                    break;
                case "Identifier":
                    this.analyzeIdentifier(ast.right);
                    break;
                default:
                    break;
            }
        };
        this.analyzeIndexAccess = (ast) => {
            switch (ast.base.type) {
                case "IndexAccess":
                    this.analyzeIndexAccess(ast.base);
                    break;
                case "Identifier":
                    this.analyzeIdentifier(ast.base);
                    break;
                default:
                    break;
            }
            switch (ast.index.type) {
                case "MemberAccess":
                    this.analyzeMemberAccess(ast.index);
                    break;
                case "Identifier":
                    this.analyzeIdentifier(ast.index);
                    break;
                default:
                    break;
            }
        };
        this.analyzeMemberAccess = (ast) => {
            switch (ast.expression.type) {
                case "IndexAccess":
                    this.analyzeIndexAccess(ast.expression);
                    break;
                case "Identifier":
                    this.analyzeIdentifier(ast.expression);
                    break;
                default:
                    break;
            }
        };
        this.analyzeIdentifier = (ast) => {
            const statementParent = this.findParent(ast.name);
            // Bug in solidity parser does't give the exact location end
            const newLoc = ast.loc;
            newLoc.end.column = newLoc.start.column + ast.name.length;
            const node = new node_1.Node(this.uri, newLoc, ast.type, ast.name);
            if (statementParent) {
                node.setParent(statementParent);
                statementParent.addChild(node);
                return;
            }
            this.orphanNodes.push(node);
        };
        this.findParent = (name) => {
            if (this.analyzerTree) {
                let node = this.search(this.analyzerTree, name);
                return this.goUp(node, name);
            }
            return null;
        };
        this.goUp = (node, name) => {
            var _a;
            if (!node) {
                return node;
            }
            if (((_a = node.parent) === null || _a === void 0 ? void 0 : _a.name) === name) {
                node = this.goUp(node.parent, name);
            }
            return node;
        };
        this.search = (node, name) => {
            if (!node) {
                return null;
            }
            else if (node.name === name) {
                return node;
            }
            else if (!node.children || !node.children.length) {
                return null;
            }
            for (const child of node.children) {
                node = this.search(child, name);
                if ((node === null || node === void 0 ? void 0 : node.name) === name) {
                    return node;
                }
            }
            return null;
        };
        this.findParentByPositionEnd = (end) => {
            if (this.analyzerTree) {
                let node = this.searchByPositionEnd(this.analyzerTree, end);
                if (node) {
                    return this.goUp(node, node.name);
                }
            }
            return null;
        };
        this.searchByPositionEnd = (node, end) => {
            if (!node) {
                return null;
            }
            else if (node.loc.end.line === end.line &&
                node.loc.end.column === end.column) {
                return node;
            }
            else if (!node.children || !node.children.length) {
                return null;
            }
            for (const child of node.children) {
                node = this.searchByPositionEnd(child, end);
                if ((node === null || node === void 0 ? void 0 : node.loc.end.line) === end.line &&
                    (node === null || node === void 0 ? void 0 : node.loc.end.column) === end.column) {
                    return node;
                }
            }
            return null;
        };
        this.uri = uri;
        this.ast = ast;
        console.log(JSON.stringify(ast));
        this.analyzeSourceUnit(ast);
        for (const orphanNode of this.orphanNodes) {
            // TO-DO: Implement find parent by scope
            if (!orphanNode.name) {
                continue;
            }
            const orphanParent = this.findParent(orphanNode.name);
            if (orphanParent) {
                orphanNode.setParent(orphanParent);
                orphanParent.addChild(orphanNode);
            }
        }
        console.log(JSON.stringify(this.analyzerTree, utils_1.getCircularReplacer()));
    }
}
exports.Analyzer = Analyzer;
//# sourceMappingURL=analyzer.js.map