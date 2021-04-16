const fs = require('fs');

const types = ['SourceUnit', 'PragmaDirective', 'ImportDirective', 'ContractDefinition', 'InheritanceSpecifier', 'StateVariableDeclaration', 'UsingForDeclaration', 'StructDefinition', 'ModifierDefinition', 'ModifierInvocation', 'FunctionDefinition', 'EventDefinition', 'EnumValue', 'EnumDefinition', 'VariableDeclaration', 'UserDefinedTypeName', 'ArrayTypeName', 'Mapping', 'ElementaryTypeName', 'FunctionTypeName', 'Block', 'ExpressionStatement', 'IfStatement', 'UncheckedStatement', 'WhileStatement', 'ForStatement', 'InlineAssemblyStatement', 'DoWhileStatement', 'ContinueStatement', 'Break', 'Continue', 'BreakStatement', 'ReturnStatement', 'EmitStatement', 'ThrowStatement', 'VariableDeclarationStatement', 'FunctionCall', 'AssemblyBlock', 'AssemblyCall', 'AssemblyLocalDefinition', 'AssemblyAssignment', 'AssemblyStackAssignment', 'LabelDefinition', 'AssemblySwitch', 'AssemblyCase', 'AssemblyFunctionDefinition', 'AssemblyFunctionReturns', 'AssemblyFor', 'AssemblyIf', 'AssemblyLiteral', 'SubAssembly', 'NewExpression', 'TupleExpression', 'TypeNameExpression', 'NameValueExpression', 'NumberLiteral', 'BooleanLiteral', 'HexLiteral', 'StringLiteral', 'Identifier', 'BinaryOperation', 'UnaryOperation', 'Conditional', 'IndexAccess', 'IndexRangeAccess', 'MemberAccess', 'HexNumber', 'DecimalNumber'];

for (const type of types) {
    let argName = type.charAt(0).toLowerCase() + type.slice(1);

    if (['break', 'continue'].indexOf(argName) !== -1) {
        argName = `ast${type}`;
    }

    fs.writeFileSync(`${__dirname}/${type}Node.ts`,
`import { AST, ${type} } from "@solidity-parser/parser/dist/ast-types";

import { FinderType } from "../matcher";
import { Node } from "./Node";

export class ${type}Node extends Node<${type}> {
    constructor(${argName}: ${type}, uri: string) {
        // TO-DO: Implement name location for rename (maybe have it as part of the abstract class)
        super(${argName}, uri);
    }

    accept<K extends AST>(find: FinderType, orphanNodes: Node<K>[], parent?: Node<K>): void {
        // TO-DO: Implement accept
    }
}
`);
}
