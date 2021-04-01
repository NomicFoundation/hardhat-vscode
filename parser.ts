import * as parser from "@solidity-parser/parser";

import {
    AST,
    ContractDefinition,
    ExpressionStatement,
    FunctionDefinition,
    SourceUnit,
    StateVariableDeclaration
} from "@solidity-parser/parser/dist/ast-types";

interface LineColumnPair {
    line: number;
    column: number;
}

interface Identifier {
    name: string;
    type: string;
    positions: number[];
    definition?: LineColumnPair;
    linesColumnPairs: LineColumnPair[];
}

export class Parser {
    sourceCode: string;
    ast: AST;
    identifierNameMap: { [name: string]: Identifier | undefined };
    identifierPositionsMap: { [position: number]: Identifier | undefined };
    identifierLineMap: { [linePositionPair: string]: Identifier | undefined };

    constructor(sourceCode: string) {
        this.sourceCode = sourceCode;
        this.identifierNameMap = {};
        this.identifierPositionsMap = {};
        this.identifierLineMap = {};

        this.ast = parser.parse(this.sourceCode, {
            loc: true,
            range: true,
            tolerant: true,
        })

        this.parseSourceUnit(<SourceUnit>this.ast);
    }

    parseSourceUnit = (ast: SourceUnit) => {
        for (const child of ast.children) {
            this.parseSourceDefinition(<ContractDefinition>child);
        }
    };

    parseSourceDefinition = (ast: ContractDefinition) => {
        for (const subNode of ast.subNodes) {
            switch (subNode.type) {
                case "StateVariableDeclaration":
                    this.parseStateVariableDeclaration(subNode);
                    break;
                case "FunctionDefinition":
                    this.parseFunctionDefinition(subNode);
                    break;
            }
        }
    };

    parseStateVariableDeclaration = (ast: StateVariableDeclaration) => {
        for (const variable of ast.variables) {
            this.insertIdentifier(variable.name, "", variable.range[0], variable.loc, true);
        }
    };

    parseFunctionDefinition = (ast: FunctionDefinition) => {
        this.insertIdentifier(ast.name, "", ast.range[0] + 9, {
            start: {
                // @ts-ignore
                line: ast.loc.start.line,
                // @ts-ignore
                column: ast.loc.start.column + 9,
            }
        });
        for (const statement of ast.body.statements) {
            switch (statement.type) {
                case "ExpressionStatement":
                    this.parseExpressionStatement(statement);
                    break;
            }
        }
    };

    parseExpressionStatement = (ast: ExpressionStatement) => {
        switch (ast.expression.type) {
            case "BinaryOperation":
                const op = ast.expression;
                if (op.left.type === "Identifier") {
                    this.insertIdentifier(op.left.name, "", op.left.range[0], op.left.loc);
                }
                if (op.right.type === "Identifier") {
                    this.insertIdentifier(op.right.name, "", op.right.range[0], op.left.loc);
                }
                break;
            case "FunctionCall":
                const fnCall = ast.expression;
                if (fnCall.expression.type === "Identifier") {
                    this.insertIdentifier(fnCall.expression.name, "", fnCall.expression.range[0], fnCall.expression.loc);
                }
        }
    }

    insertIdentifier = (name: string, type: string, position: number, loc: any, isDefinition?: boolean) => {
        let identifier = this.identifierNameMap[name];
        if (identifier === undefined) {
            identifier = {
                name: name,
                type: type,
                positions: [],
                linesColumnPairs: [],
            };
            this.identifierNameMap[name] = identifier;
            if (isDefinition) {
                identifier.definition = {line: loc.start.line, column: loc.start.column};
            }
        }

        identifier.positions.push(position);
        identifier.linesColumnPairs.push({line: loc.start.line, column: loc.start.column});
        this.identifierPositionsMap[position] = identifier;
        this.identifierLineMap[loc.start.line + ":" + loc.start.column] = identifier;
    };

    goToDefinition = (lineNumber: number, column: number): LineColumnPair | undefined => {
        const key = lineNumber + ":" + column;
        const identifier = this.identifierLineMap[key];
        if (!identifier) {
            return undefined;
        }

        return identifier.definition;
    };

    showUsages = (lineNumber: number, column: number): LineColumnPair[] | undefined => {
        const key = lineNumber + ":" + column;
        const identifier = this.identifierLineMap[key];
        if (!identifier) {
            return undefined;
        }

        return identifier.linesColumnPairs;
    }

    rename = (lineNumber: number, column: number, newName: string): string => {
        const key = lineNumber + ":" + column;
        const identifier = this.identifierLineMap[key];
        if (!identifier) {
            throw new Error("no identifier found at position")
        }


        const nameLen = identifier.name.length;
        let prevIndex = 0;
        const parts: string[] = [];

        for (const position of identifier.positions) {
            parts.push(this.sourceCode.substring(prevIndex, position));
            parts.push(newName);
            prevIndex = position + nameLen;
        }

        parts.push(this.sourceCode.substring(prevIndex, this.sourceCode.length));

        return parts.join("");
    };
}
