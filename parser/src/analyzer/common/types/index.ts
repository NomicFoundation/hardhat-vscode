import {
    ASTNode, ArrayTypeName, AssemblyAssignment, AssemblyBlock, AssemblyCall,
    AssemblyCase, AssemblyFor, AssemblyFunctionDefinition, AssemblyFunctionReturns,
    AssemblyIf, AssemblyLiteral, AssemblyLocalDefinition, AssemblyMemberAccess,
    AssemblyStackAssignment, AssemblySwitch, BinaryOperation, Block, BooleanLiteral,
    Break, BreakStatement, CatchClause, Conditional, Continue, ContinueStatement,
    ContractDefinition, CustomErrorDefinition, DecimalNumber, DoWhileStatement,
    ElementaryTypeName, EmitStatement, EnumDefinition, EnumValue, EventDefinition,
    ExpressionStatement, FileLevelConstant, ForStatement, FunctionCall,
    FunctionDefinition, FunctionTypeName, HexLiteral, HexNumber, Identifier,
    IfStatement, ImportDirective, IndexAccess, IndexRangeAccess, InheritanceSpecifier,
    InlineAssemblyStatement, LabelDefinition, Mapping, MemberAccess, ModifierDefinition,
    ModifierInvocation, NameValueExpression, NameValueList, NewExpression,
    NumberLiteral, PragmaDirective, ReturnStatement, RevertStatement, SourceUnit,
    StateVariableDeclaration, StringLiteral, StructDefinition, SubAssembly,
    ThrowStatement, TryStatement, TupleExpression, TypeNameExpression, UnaryOperation,
    UncheckedStatement, UserDefinedTypeName, UsingForDeclaration, VariableDeclaration,
    StateVariableDeclarationVariable, VariableDeclarationStatement, WhileStatement
} from "@solidity-parser/parser/dist/src/ast-types";

export {
    ASTNode, ArrayTypeName, AssemblyAssignment, AssemblyBlock, AssemblyCall,
    AssemblyCase, AssemblyFor, AssemblyFunctionDefinition, AssemblyFunctionReturns,
    AssemblyIf, AssemblyLiteral, AssemblyLocalDefinition, AssemblyMemberAccess,
    AssemblyStackAssignment, AssemblySwitch, BinaryOperation, Block, BooleanLiteral,
    Break, BreakStatement, CatchClause, Conditional, Continue, ContinueStatement,
    ContractDefinition, CustomErrorDefinition, DecimalNumber, DoWhileStatement,
    ElementaryTypeName, EmitStatement, EnumDefinition, EnumValue, EventDefinition,
    ExpressionStatement, FileLevelConstant, ForStatement, FunctionCall,
    FunctionDefinition, FunctionTypeName, HexLiteral, HexNumber, Identifier,
    IfStatement, ImportDirective, IndexAccess, IndexRangeAccess, InheritanceSpecifier,
    InlineAssemblyStatement, LabelDefinition, Mapping, MemberAccess, ModifierDefinition,
    ModifierInvocation, NameValueExpression, NameValueList, NewExpression,
    NumberLiteral, PragmaDirective, ReturnStatement, RevertStatement, SourceUnit,
    StateVariableDeclaration, StringLiteral, StructDefinition, SubAssembly,
    ThrowStatement, TryStatement, TupleExpression, TypeNameExpression, UnaryOperation,
    UncheckedStatement, UserDefinedTypeName, UsingForDeclaration, VariableDeclaration,
    StateVariableDeclarationVariable, VariableDeclarationStatement, WhileStatement
};

import { Position, Location, FinderType, Node } from "@nodes/Node";
export { Position, Location, FinderType, Node };

export abstract class ContractDefinitionNode extends Node {
    inheritanceNodes: ContractDefinitionNode[] = [];

    abstract getKind(): string;
    getInheritanceNodes(): ContractDefinitionNode[] {
        return this.inheritanceNodes;
    }
}

export abstract class ImportDirectiveNode extends Node {
    abstract realUri: string;
    importPath: string | undefined;
    aliasNodes: Node[] = [];

    setImportPath(importPath: string | undefined): void {
        this.importPath = importPath;
    }

    getImportPath(): string | undefined {
        return this.importPath;
    }

    addAliasNode(aliasNode: Node): void {
        this.aliasNodes.push(aliasNode);
    }

    getAliasNodes(): Node[] {
        return this.aliasNodes;
    }
}

export abstract class SourceUnitNode extends Node {
    importNodes: Node[] = [];
    exportNodes: Node[] = [];

    addImportNode(importNode: Node): void {
        this.importNodes.push(importNode);
    }

    getImportNodes(): Node[] {
        return this.importNodes;
    }

    addExportNode(exportNode: Node): void {
        this.exportNodes.push(exportNode);
    }

    getExportNodes(): Node[] {
        return this.exportNodes;
    }
}

export interface DocumentAnalyzer {
    document: string | undefined;
    uri: string;

    ast: ASTNode | undefined;

    analyzerTree?: Node;

    orphanNodes: Node[];

    analyze(document?: string): Node | undefined;
}

// documentsAnalyzer Map { [uri: string]: DocumentAnalyzer } have all documentsAnalyzer class instances used for handle imports on first project start.
export type DocumentsAnalyzerMap = { [uri: string]: DocumentAnalyzer | undefined };

export const definitionNodeTypes = [ "ContractDefinition", "StructDefinition", "ModifierDefinition", "FunctionDefinition", "EventDefinition", "EnumDefinition", "AssemblyLocalDefinition", "LabelDefinition", "AssemblyFunctionDefinition", "UserDefinedTypeName", "FileLevelConstant" ];
