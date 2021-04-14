const fs = require('fs');

let types = ['SourceUnit', 'PragmaDirective', 'PragmaName', 'PragmaValue', 'ImportDirective', 'ContractDefinition', 'InheritanceSpecifier', 'StateVariableDeclaration', 'UsingForDeclaration', 'StructDefinition', 'ModifierDefinition', 'ModifierInvocation', 'FunctionDefinition', 'EventDefinition', 'EnumValue', 'EnumDefinition', 'VariableDeclaration', 'UserDefinedTypeName', 'Mapping', 'ArrayTypeName', 'FunctionTypeName', 'StorageLocation', 'StateMutability', 'Block', 'ExpressionStatement', 'IfStatement', 'WhileStatement', 'ForStatement', 'InlineAssemblyStatement', 'DoWhileStatement', 'ContinueStatement', 'Break', 'Continue', 'BreakStatement', 'ReturnStatement', 'EmitStatement', 'ThrowStatement', 'VariableDeclarationStatement', 'IdentifierList', 'ElementaryTypeName', 'FunctionCall', 'AssemblyBlock', 'AssemblyItem', 'AssemblyCall', 'AssemblyLocalDefinition', 'AssemblyAssignment', 'AssemblyStackAssignment', 'LabelDefinition', 'AssemblySwitch', 'AssemblyCase', 'AssemblyFunctionDefinition', 'AssemblyFunctionReturns', 'AssemblyFor', 'AssemblyIf', 'AssemblyLiteral', 'SubAssembly', 'TupleExpression', 'TypeNameExpression', 'NameValueExpression', 'BooleanLiteral', 'NumberLiteral', 'Identifier', 'BinaryOperation', 'UnaryOperation', 'NewExpression', 'Conditional', 'StringLiteral', 'HexLiteral', 'HexNumber', 'DecimalNumber', 'MemberAccess', 'IndexAccess', 'IndexRangeAccess', 'NameValueList', 'UncheckedStatement'];

for (const type of types) {
    const argName = type.charAt(0).toLowerCase() + type.slice(1);

    fs.writeFileSync(`${__dirname}/${type}Node.ts`,
`import { AST, ${type} } from "@solidity-parser/parser/dist/ast-types";

import { Location, Node } from './Node';

class ${type}Node implements Node {
    type: string;

    uri: string;
    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    astNode: AST;

    constructor (uri: string, ${argName}: ${type}) {
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
