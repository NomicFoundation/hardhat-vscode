const fs = require('fs');

const types = ['SourceUnit', 'PragmaDirective', 'ImportDirective', 'ContractDefinition', 'InheritanceSpecifier', 'StateVariableDeclaration', 'UsingForDeclaration', 'StructDefinition', 'ModifierDefinition', 'ModifierInvocation', 'FunctionDefinition', 'EventDefinition', 'EnumValue', 'EnumDefinition', 'VariableDeclaration', 'UserDefinedTypeName', 'ArrayTypeName', 'Mapping', 'ElementaryTypeName', 'FunctionTypeName', 'Block', 'ExpressionStatement', 'IfStatement', 'UncheckedStatement', 'WhileStatement', 'ForStatement', 'InlineAssemblyStatement', 'DoWhileStatement', 'ContinueStatement', 'Break', 'Continue', 'BreakStatement', 'ReturnStatement', 'EmitStatement', 'ThrowStatement', 'VariableDeclarationStatement', 'FunctionCall', 'AssemblyBlock', 'AssemblyCall', 'AssemblyLocalDefinition', 'AssemblyAssignment', 'AssemblyStackAssignment', 'LabelDefinition', 'AssemblySwitch', 'AssemblyCase', 'AssemblyFunctionDefinition', 'AssemblyFunctionReturns', 'AssemblyFor', 'AssemblyIf', 'AssemblyLiteral', 'SubAssembly', 'NewExpression', 'TupleExpression', 'TypeNameExpression', 'NameValueExpression', 'NumberLiteral', 'BooleanLiteral', 'HexLiteral', 'StringLiteral', 'Identifier', 'BinaryOperation', 'UnaryOperation', 'Conditional', 'IndexAccess', 'IndexRangeAccess', 'MemberAccess', 'HexNumber', 'DecimalNumber'];

for (const type of types) {
    const argName = type.charAt(0).toLowerCase() + type.slice(1);

    fs.writeFileSync(`${__dirname}/${type}Node.ts`,
`import { AST, ${type} } from "@solidity-parser/parser/dist/ast-types";

import { Location, Node } from './Node';

export class ${type}Node implements Node {
    type: string;

    uri: string;
    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    astNode: AST;

    constructor (${argName}: ${type}, uri: string) {
        this.type = ${argName}.type;

        this.uri = uri;
        // TO-DO: Implement name location for rename

        this.astNode = ${argName};
    }

    addChild(child: Node): void {
        this.children.push(child);
    }

    setParent(parent: Node): void {
        this.parent = parent;
    }

    accept(orphanNodes: Node[], parent?: Node): void {
        // TO-DO: Method not implemented
    }
}
`);
}
