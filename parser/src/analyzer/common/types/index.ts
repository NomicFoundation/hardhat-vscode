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

    /**
     * Kind can be "abstract" | "contract" | "library" | "interface"
     * @returns Contract kind
     */
    abstract getKind(): string;

    /**
     * @returns inherited Nodes
     */
    getInheritanceNodes(): ContractDefinitionNode[] {
        return this.inheritanceNodes;
    }
}

export abstract class ImportDirectiveNode extends Node {
    /**
     * The path to the file.
     * But in this case, realUri will be the URI of the file in which the import is declared.
     * And {@link Node.uri uri} will be a path to imported Node
     */
    abstract realUri: string;

    aliasNodes: Node[] = [];

    getImportPath(): string | undefined {
        return this.uri;
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

    /**
     * @returns all imported Nodes in this SourceUint
     */
    getImportNodes(): Node[] {
        return this.importNodes;
    }

    addExportNode(exportNode: Node): void {
        this.exportNodes.push(exportNode);
    }

    /**
     * @returns all exported Nodes from this SourceUint
     */
    getExportNodes(): Node[] {
        return this.exportNodes;
    }
}

export interface DocumentAnalyzer {
    /**
     * The contents of the file we will try to analyze.
     */
    document: string | undefined;
    /**
     * The path to the file with the document we are analyzing.
     */
    uri: string;

    /**
     * AST that we get from @solidity-parser/parser.
     */
    ast: ASTNode | undefined;

    /**
     * Analyzed tree.
     */
    analyzerTree?: Node | undefined;

    /**
     * This is the place for all the Nodes for which we couldn't find a parent
     */
    orphanNodes: Node[];

    analyze(document?: string): Node | undefined;
}

/**
 * documentsAnalyzer Map { [uri: string]: DocumentAnalyzer } have all documentsAnalyzer class instances used for handle imports on first project start.
 */
export type DocumentsAnalyzerMap = { [uri: string]: DocumentAnalyzer | undefined };

export const definitionNodeTypes = [ "ContractDefinition", "StructDefinition", "ModifierDefinition", "FunctionDefinition", "EventDefinition", "EnumDefinition", "AssemblyLocalDefinition", "LabelDefinition", "AssemblyFunctionDefinition", "UserDefinedTypeName", "FileLevelConstant" ];
