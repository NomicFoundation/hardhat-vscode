import {
    AST,
    SourceUnit,
    ContractDefinition,
    StateVariableDeclaration,
    FunctionDefinition,
    ExpressionStatement,
    BinaryOperation,
    Identifier,
    IndexAccess,
    MemberAccess,
    ReturnStatement
} from "@solidity-parser/parser/dist/ast-types";

import {
    Node,
    Location,
    Position
} from "./node"

import { getCircularReplacer } from "./utils";

export class Analyzer {
    uri: string;
    ast: AST;

    analyzerTree?: Node;

    orphanNodes: Node[] = [];

    constructor(uri: string, ast: AST) {
        this.uri = uri;
        this.ast = ast;

        this.analyzeSourceUnit(<SourceUnit>ast);

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

        console.log(JSON.stringify(this.analyzerTree, getCircularReplacer()));
    }

    analyzeSourceUnit = (ast: SourceUnit) => {
        this.analyzerTree = new Node(this.uri, <Location><unknown>ast.loc, ast.type);
            
        for (const child of ast.children) {
            switch (child.type) {
                case 'ContractDefinition':
                    this.analyzeContractDefinition(this.analyzerTree, child);
                    break;

                default:
                    break;
            }
        }
    }

    analyzeContractDefinition = (parent: Node, ast: ContractDefinition) => {
        const node = new Node(this.uri, <Location><unknown>ast.loc, ast.type, ast.name, parent);

        for (const subNode of ast.subNodes) {
            switch (subNode.type) {
                case 'StateVariableDeclaration':
                    this.analyzeStateVariableDeclaration(node, subNode);
                    break;

                case 'FunctionDefinition':
                    this.analyzeFunctionDefinition(node, subNode);
                    break;
            
                default:
                    break;
            }
        }

        this.analyzerTree?.addChild(node);
    };

    analyzeStateVariableDeclaration = (parent: Node, ast: StateVariableDeclaration) => {
        for (const variable of ast.variables) {
            // Bug in solidity parser does't give the exact location end
            const newLoc = <Location><unknown>variable.loc;
            newLoc.end.column = newLoc.start.column + variable.name.length;

            const node = new Node(this.uri, newLoc, variable.type, variable.name, parent);

            parent.addChild(node);
        }
    };

    analyzeFunctionDefinition = (parent: Node, ast: FunctionDefinition) => {
        const functionDefinitionNode = new Node(this.uri, <Location><unknown>ast.loc, ast.type, ast.name, parent);

        for (const parameter of ast.parameters) {
            // Bug in solidity parser does't give the exact location start & end
            const newLoc = <Location><unknown>parameter.loc;
            newLoc.start.line = newLoc.end.line;
            newLoc.start.column = newLoc.end.column;
            newLoc.end.column = newLoc.end.column + parameter.name.length;

            const parameterNode = new Node(this.uri, newLoc, parameter.type, parameter.name, functionDefinitionNode);

            functionDefinitionNode.addChild(parameterNode);
        }

        for (const statement of ast.body!.statements) {
            switch (statement.type) {
                case "ExpressionStatement":
                    this.analyzeExpressionStatement(statement)
                    break;

                case "ReturnStatement":
                    this.analyzeReturnStatement(statement)
                    break;

                default:
                    break;
            }
        }

        parent.addChild(functionDefinitionNode);
    };

    analyzeExpressionStatement = (ast: ExpressionStatement) => {
        switch (ast.expression.type) {
            case "BinaryOperation":
                this.analyzeBinaryOperation(ast.expression);
                break;

            case "IndexAccess":
                this.analyzeIndexAccess(ast.expression)
                break;

            default:
                break;
        }
    };

    analyzeReturnStatement = (ast: ReturnStatement) => {
        switch (ast.expression?.type) {
            case "BinaryOperation":
                this.analyzeBinaryOperation(ast.expression);
                break;

            case "IndexAccess":
                this.analyzeIndexAccess(ast.expression)
                break;

            default:
                break;
        }
    };

    analyzeBinaryOperation = (ast: BinaryOperation) => {
        switch (ast.left.type) {
            case "IndexAccess":
                this.analyzeIndexAccess(ast.left)
                break;

            case "Identifier":
                this.analyzeIdentifier(ast.left)
                break;
        
            default:
                break;
        }

        switch (ast.right.type) {
            case "IndexAccess":
                this.analyzeIndexAccess(ast.right)
                break;

            case "Identifier":
                this.analyzeIdentifier(ast.right)
                break;
        
            default:
                break;
        }
    };

    analyzeIndexAccess = (ast: IndexAccess) => {
        switch (ast.base.type) {
            case "IndexAccess":
                this.analyzeIndexAccess(ast.base)
                break;

            case "Identifier":
                this.analyzeIdentifier(ast.base)
                break;
        
            default:
                break;
        }

        switch (ast.index.type) {
            case "MemberAccess":
                this.analyzeMemberAccess(ast.index)
                break;

            case "Identifier":
                this.analyzeIdentifier(ast.index)
                break;
            
            default:
                break;
        }
    };

    analyzeMemberAccess = (ast: MemberAccess) => {
        switch (ast.expression.type) {
            case "IndexAccess":
                this.analyzeIndexAccess(ast.expression)
                break;

            case "Identifier":
                this.analyzeIdentifier(ast.expression)
                break;
        
            default:
                break;
        }
    };

    analyzeIdentifier = (ast: Identifier) => {
        const statementParent = this.findParent(ast.name);

        // Bug in solidity parser does't give the exact location end
        const newLoc = <Location><unknown>ast.loc;
        newLoc.end.column = newLoc.start.column + ast.name.length;

        const node = new Node(this.uri, newLoc, ast.type, ast.name);

        if (statementParent) {
            node.setParent(statementParent);
            statementParent.addChild(node);

            return;
        }

        this.orphanNodes.push(node);
    };

    findParent = (name: string): Node | null => {
        if (this.analyzerTree) {
            let node = this.search(this.analyzerTree, name);

            return this.goUp(node, name);
        }
        
        return null;
    };

    goUp = (node: Node | null, name: string): Node | null => {
        if (!node) {
            return node;
        }

        if (node.parent?.name === name) {
            node = this.goUp(node.parent, name);
        }

        return node;
    };

    search = (node: Node | null, name: string): Node | null => {
        if (!node) {
            return null;
        } else if (node.name === name) {
            return node;
        } else if (!node.children || !node.children.length) {
            return null;
        }

        for (const child of node.children) {
            node = this.search(child, name);

            if (node?.name === name) {
                return node;
            }
        }

        return null;
    };

    findParentByPositionEnd = (end: Position): Node | null => {
        if (this.analyzerTree) {
            let node = this.searchByPositionEnd(this.analyzerTree, end);

            if (node) {
                return this.goUp(node, <string>node.name);
            }
        }
        
        return null;
    };

    searchByPositionEnd = (node: Node | null, end: Position): Node | null => {
        if (!node) {
            return null;
        } else if (
            node.loc.end.line === end.line &&
            node.loc.end.column === end.column
        ) {
            return node;
        } else if (!node.children || !node.children.length) {
            return null;
        }

        for (const child of node.children) {
            node = this.searchByPositionEnd(child, end);

            if (
                node?.loc.end.line === end.line &&
                node?.loc.end.column === end.column
            ) {
                return node;
            }
        }

        return null;
    };
}
