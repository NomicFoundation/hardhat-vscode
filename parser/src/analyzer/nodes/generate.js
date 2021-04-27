const fs = require('fs');

const types = ['SourceUnit', 'PragmaDirective', 'ImportDirective', 'ContractDefinition', 'InheritanceSpecifier', 'StateVariableDeclaration', 'UsingForDeclaration', 'StructDefinition', 'ModifierDefinition', 'ModifierInvocation', 'FunctionDefinition', 'EventDefinition', 'EnumValue', 'EnumDefinition', 'VariableDeclaration', 'UserDefinedTypeName', 'ArrayTypeName', 'Mapping', 'ElementaryTypeName', 'FunctionTypeName', 'Block', 'ExpressionStatement', 'IfStatement', 'UncheckedStatement', 'WhileStatement', 'ForStatement', 'InlineAssemblyStatement', 'DoWhileStatement', 'ContinueStatement', 'Break', 'Continue', 'BreakStatement', 'ReturnStatement', 'EmitStatement', 'ThrowStatement', 'VariableDeclarationStatement', 'FunctionCall', 'AssemblyBlock', 'AssemblyCall', 'AssemblyLocalDefinition', 'AssemblyAssignment', 'AssemblyStackAssignment', 'LabelDefinition', 'AssemblySwitch', 'AssemblyCase', 'AssemblyFunctionDefinition', 'AssemblyFunctionReturns', 'AssemblyFor', 'AssemblyIf', 'AssemblyLiteral', 'SubAssembly', 'NewExpression', 'TupleExpression', 'TypeNameExpression', 'NameValueExpression', 'NumberLiteral', 'BooleanLiteral', 'HexLiteral', 'StringLiteral', 'Identifier', 'BinaryOperation', 'UnaryOperation', 'Conditional', 'IndexAccess', 'IndexRangeAccess', 'MemberAccess', 'HexNumber', 'DecimalNumber'];

for (const type of types) {
    let argName = type.charAt(0).toLowerCase() + type.slice(1);

    if (['break', 'continue'].indexOf(argName) !== -1) {
        argName = `ast${type}`;
    }

    fs.writeFileSync(`${__dirname}/${type}Node.ts`,
`import { ${type} } from "@solidity-parser/parser/dist/src/ast-types";

import { Location, FinderType, Node } from "./Node";

export class ${type}Node implements Node {
    type: string;
    uri: string;
    astNode: ${type};

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    typeNodes: Node[] = [];

    constructor (${argName}: ${type}, uri: string) {
        this.type = ${argName}.type;
        this.uri = uri;
        this.astNode = ${argName};
        // TO-DO: Implement name location for rename
    }

    getTypeNodes(): Node[] {
        return this.typeNodes;
    }

    addChild(child: Node): void {
        this.children.push(child);
    }

    setParent(parent: Node): void {
        this.parent = parent;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node): Node {
        // TO-DO: Method not implemented
        return this;
    }
}
`);
}
