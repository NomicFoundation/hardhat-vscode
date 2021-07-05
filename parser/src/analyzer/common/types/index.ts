import {
    ASTNode, ArrayTypeName, AssemblyAssignment, AssemblyBlock, AssemblyCall,
    AssemblyCase, AssemblyFor, AssemblyFunctionDefinition, AssemblyFunctionReturns,
    AssemblyIf, AssemblyLiteral, AssemblyLocalDefinition, AssemblyMemberAccess,
    AssemblyStackAssignment, AssemblySwitch, BinaryOperation, Block, BooleanLiteral,
    Break, BreakStatement, CatchClause, Conditional, Continue, ContinueStatement,
    ContractDefinition, CustomErrorDefinition, DecimalNumber, DoWhileStatement,
    ElementaryTypeName, EmitStatement, EnumDefinition, EnumValue, EventDefinition,
    ExpressionStatement, FileLevelConstant, ForStatement, FunctionCall, TypeName,
    FunctionDefinition, FunctionTypeName, HexLiteral, HexNumber, Identifier,
    IfStatement, ImportDirective, IndexAccess, IndexRangeAccess, InheritanceSpecifier,
    InlineAssemblyStatement, LabelDefinition, Mapping, MemberAccess, ModifierDefinition,
    ModifierInvocation, NameValueExpression, NameValueList, NewExpression,
    NumberLiteral, PragmaDirective, ReturnStatement, RevertStatement, SourceUnit,
    StateVariableDeclaration, StringLiteral, StructDefinition, SubAssembly,
    ThrowStatement, TryStatement, TupleExpression, TypeNameExpression, UnaryOperation,
    UncheckedStatement, UserDefinedTypeName, UsingForDeclaration, VariableDeclaration,
    StateVariableDeclarationVariable, VariableDeclarationStatement, WhileStatement, BaseASTNode
} from "@solidity-parser/parser/dist/src/ast-types";

export {
    ASTNode, ArrayTypeName, AssemblyAssignment, AssemblyBlock, AssemblyCall,
    AssemblyCase, AssemblyFor, AssemblyFunctionDefinition, AssemblyFunctionReturns,
    AssemblyIf, AssemblyLiteral, AssemblyLocalDefinition, AssemblyMemberAccess,
    AssemblyStackAssignment, AssemblySwitch, BinaryOperation, Block, BooleanLiteral,
    Break, BreakStatement, CatchClause, Conditional, Continue, ContinueStatement,
    ContractDefinition, CustomErrorDefinition, DecimalNumber, DoWhileStatement,
    ElementaryTypeName, EmitStatement, EnumDefinition, EnumValue, EventDefinition,
    ExpressionStatement, FileLevelConstant, ForStatement, FunctionCall, TypeName,
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

import { Position, Location, FinderType, EmptyNodeType, DocumentAnalyzer, DocumentsAnalyzerMap, Node } from "@nodes/Node";
export { Position, Location, FinderType, DocumentAnalyzer, DocumentsAnalyzerMap, Node };

export class EmptyNode extends Node {
    astNode: EmptyNodeType;

    constructor (emptyNode: EmptyNodeType, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) {
        super(emptyNode, uri, rootPath, documentsAnalyzer);
        this.astNode = emptyNode;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        return this;
    }
}

export abstract class ContractDefinitionNode extends Node {
    /**
     * AST ContractDefinition interface.
     */
    abstract astNode: ContractDefinition;

    inheritanceNodes: ContractDefinitionNode[] = [];

    /**
     * Kind can be "abstract" | "contract" | "library" | "interface".
     * @returns Contract kind.
     */
    abstract getKind(): string;

    /**
     * @returns inherited Nodes
     */
    getInheritanceNodes(): ContractDefinitionNode[] {
        return this.inheritanceNodes;
    }
}

export abstract class MemberAccessNode extends Node {
    /**
     * AST MemberAccess interface.
     */
    abstract astNode: MemberAccess;

    previousMemberAccessNode: Node | undefined;

    setPreviousMemberAccessNode(node: Node): void {
        this.previousMemberAccessNode = node;
    }

    /**
     * @returns get previous MemberAccessNode
     */
    getPreviousMemberAccessNode(): Node | undefined {
        return this.previousMemberAccessNode;
    }
}

export abstract class ImportDirectiveNode extends Node {
    /**
     * AST ImportDirective interface.
     */
    abstract astNode: ImportDirective;

    /**
     * The path to the file.
     * But in this case, realUri will be the URI of the file in which the import is declared.
     * And {@link Node.uri uri} will be a path to imported Node.
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
    /**
     * AST SourceUnit interface.
     */
    abstract astNode: SourceUnit;

    importNodes: Node[] = [];
    exportNodes: Node[] = [];

    addImportNode(importNode: Node): void {
        this.importNodes.push(importNode);
    }

    /**
     * @returns all imported Nodes in this SourceUint.
     */
    getImportNodes(): Node[] {
        return this.importNodes;
    }

    addExportNode(exportNode: Node): void {
        this.exportNodes.push(exportNode);
    }

    /**
     * @returns all exported Nodes from this SourceUint.
     */
    getExportNodes(): Node[] {
        return this.exportNodes;
    }
}

export abstract class FunctionDefinitionNode extends Node {
     /**
     * AST FunctionDefinition interface.
     */
    abstract astNode: FunctionDefinition;

    /**
     * Visability can be 'default' | 'external' | 'internal' | 'public' | 'private'
     * 
     * @returns function visability.
     */
    getVisibility(): string {
        return this.astNode.visibility;
    }
}

export abstract class VariableDeclarationNode extends Node {
    /**
    * AST VariableDeclaration interface.
    */
   abstract astNode: VariableDeclaration;

   /**
    * Visability can be 'public' | 'private' | 'internal' | 'default'
    * 
    * @returns function visability.
    */
   getVisibility(): string | undefined {
       return this.astNode.visibility;
   }
}

export const definitionNodeTypes = [ "ContractDefinition", "StructDefinition", "ModifierDefinition", "FunctionDefinition", "EventDefinition", "EnumDefinition", "AssemblyLocalDefinition", "LabelDefinition", "AssemblyFunctionDefinition", "UserDefinedTypeName", "FileLevelConstant" ];
export const declarationNodeTypes = [ "StateVariableDeclaration", "UsingForDeclaration", "VariableDeclaration", "VariableDeclarationStatement" ];
export const expressionNodeTypes = [ "IndexAccess", "IndexRangeAccess", "TupleExpression", "BinaryOperation", "Conditional", "MemberAccess", "FunctionCall", "UnaryOperation", "NewExpression", "NameValueExpression", "BooleanLiteral", "HexLiteral", "StringLiteral", "NumberLiteral", "Identifier", "TupleExpression", "TypeNameExpression" ];
