import * as astTypes from "@solidity-parser/parser/dist/src/ast-types";

import { SourceUnitNode } from "@analyzer/nodes/SourceUnitNode";
import { PragmaDirectiveNode } from "@analyzer/nodes/PragmaDirectiveNode";
import { ImportDirectiveNode } from "@analyzer/nodes/ImportDirectiveNode";
import { ContractDefinitionNode } from "@analyzer/nodes/ContractDefinitionNode";
import { InheritanceSpecifierNode } from "@analyzer/nodes/InheritanceSpecifierNode";
import { StateVariableDeclarationNode } from "@analyzer/nodes/StateVariableDeclarationNode";
import { UsingForDeclarationNode } from "@analyzer/nodes/UsingForDeclarationNode";
import { StructDefinitionNode } from "@analyzer/nodes/StructDefinitionNode";
import { ModifierDefinitionNode } from "@analyzer/nodes/ModifierDefinitionNode";
import { ModifierInvocationNode } from "@analyzer/nodes/ModifierInvocationNode";
import { FunctionDefinitionNode } from "@analyzer/nodes/FunctionDefinitionNode";
import { EventDefinitionNode } from "@analyzer/nodes/EventDefinitionNode";
import { EnumValueNode } from "@analyzer/nodes/EnumValueNode";
import { EnumDefinitionNode } from "@analyzer/nodes/EnumDefinitionNode";
import { VariableDeclarationNode } from "@analyzer/nodes/VariableDeclarationNode";
import { UserDefinedTypeNameNode } from "@analyzer/nodes/UserDefinedTypeNameNode";
import { ArrayTypeNameNode } from "@analyzer/nodes/ArrayTypeNameNode";
import { MappingNode } from "@analyzer/nodes/MappingNode";
import { ElementaryTypeNameNode } from "@analyzer/nodes/ElementaryTypeNameNode";
import { FunctionTypeNameNode } from "@analyzer/nodes/FunctionTypeNameNode";
import { BlockNode } from "@analyzer/nodes/BlockNode";
import { ExpressionStatementNode } from "@analyzer/nodes/ExpressionStatementNode";
import { IfStatementNode } from "@analyzer/nodes/IfStatementNode";
import { UncheckedStatementNode } from "@analyzer/nodes/UncheckedStatementNode";
import { WhileStatementNode } from "@analyzer/nodes/WhileStatementNode";
import { ForStatementNode } from "@analyzer/nodes/ForStatementNode";
import { InlineAssemblyStatementNode } from "@analyzer/nodes/InlineAssemblyStatementNode";
import { DoWhileStatementNode } from "@analyzer/nodes/DoWhileStatementNode";
import { ContinueStatementNode } from "@analyzer/nodes/ContinueStatementNode";
import { BreakNode } from "@analyzer/nodes/BreakNode";
import { ContinueNode } from "@analyzer/nodes/ContinueNode";
import { BreakStatementNode } from "@analyzer/nodes/BreakStatementNode";
import { ReturnStatementNode } from "@analyzer/nodes/ReturnStatementNode";
import { EmitStatementNode } from "@analyzer/nodes/EmitStatementNode";
import { ThrowStatementNode } from "@analyzer/nodes/ThrowStatementNode";
import { VariableDeclarationStatementNode } from "@analyzer/nodes/VariableDeclarationStatementNode";
import { FunctionCallNode } from "@analyzer/nodes/FunctionCallNode";
import { AssemblyBlockNode } from "@analyzer/nodes/AssemblyBlockNode";
import { AssemblyCallNode } from "@analyzer/nodes/AssemblyCallNode";
import { AssemblyLocalDefinitionNode } from "@analyzer/nodes/AssemblyLocalDefinitionNode";
import { AssemblyAssignmentNode } from "@analyzer/nodes/AssemblyAssignmentNode";
import { AssemblyStackAssignmentNode } from "@analyzer/nodes/AssemblyStackAssignmentNode";
import { LabelDefinitionNode } from "@analyzer/nodes/LabelDefinitionNode";
import { AssemblySwitchNode } from "@analyzer/nodes/AssemblySwitchNode";
import { AssemblyCaseNode } from "@analyzer/nodes/AssemblyCaseNode";
import { AssemblyFunctionDefinitionNode } from "@analyzer/nodes/AssemblyFunctionDefinitionNode";
import { AssemblyFunctionReturnsNode } from "@analyzer/nodes/AssemblyFunctionReturnsNode";
import { AssemblyForNode } from "@analyzer/nodes/AssemblyForNode";
import { AssemblyIfNode } from "@analyzer/nodes/AssemblyIfNode";
import { SubAssemblyNode } from "@analyzer/nodes/SubAssemblyNode";
import { NewExpressionNode } from "@analyzer/nodes/NewExpressionNode";
import { TupleExpressionNode } from "@analyzer/nodes/TupleExpressionNode";
import { TypeNameExpressionNode } from "@analyzer/nodes/TypeNameExpressionNode";
import { NameValueExpressionNode } from "@analyzer/nodes/NameValueExpressionNode";
import { NumberLiteralNode } from "@analyzer/nodes/NumberLiteralNode";
import { BooleanLiteralNode } from "@analyzer/nodes/BooleanLiteralNode";
import { HexLiteralNode } from "@analyzer/nodes/HexLiteralNode";
import { StringLiteralNode } from "@analyzer/nodes/StringLiteralNode";
import { IdentifierNode } from "@analyzer/nodes/IdentifierNode";
import { BinaryOperationNode } from "@analyzer/nodes/BinaryOperationNode";
import { UnaryOperationNode } from "@analyzer/nodes/UnaryOperationNode";
import { ConditionalNode } from "@analyzer/nodes/ConditionalNode";
import { IndexAccessNode } from "@analyzer/nodes/IndexAccessNode";
import { IndexRangeAccessNode } from "@analyzer/nodes/IndexRangeAccessNode";
import { MemberAccessNode } from "@analyzer/nodes/MemberAccessNode";
import { HexNumberNode } from "@analyzer/nodes/HexNumberNode";
import { DecimalNumberNode } from "@analyzer/nodes/DecimalNumberNode";
import { TryStatementNode } from "@analyzer/nodes/TryStatementNode";
import { NameValueListNode } from "@analyzer/nodes/NameValueListNode";
import { AssemblyMemberAccessNode } from "@analyzer/nodes/AssemblyMemberAccessNode";
import { CatchClauseNode } from "@analyzer/nodes/CatchClauseNode";
import { FileLevelConstantNode } from "@analyzer/nodes/FileLevelConstantNode";
import { CustomErrorDefinitionNode } from "@analyzer/nodes/CustomErrorDefinitionNode";
import { RevertStatementNode } from "@analyzer/nodes/RevertStatementNode";
import { TypeDefinitionNode } from "@analyzer/nodes/TypeDefinitionNode";

import { Node, SolFileIndexMap } from "@common/types";

type ASTTypes = astTypes.ASTNode["type"];
type ASTMap<U> = { [K in ASTTypes]: U extends { type: K } ? U : never };

type ASTTypeMap = ASTMap<astTypes.ASTNode>;
type Pattern<T> = {
  [K in keyof ASTTypeMap]: (
    ast: ASTTypeMap[K],
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) => T;
};

function matcher<T>(
  pattern: Pattern<T>
): (
  ast: astTypes.BaseASTNode,
  uri: string,
  rootPath: string,
  documentsAnalyzer: SolFileIndexMap
) => T {
  return (ast, uri, rootPath, documentsAnalyzer) =>
    pattern[ast.type](
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ast as any,
      uri as string,
      rootPath as string,
      documentsAnalyzer as SolFileIndexMap
    );
}

export const find = matcher<Node>({
  SourceUnit: (
    sourceUnit: astTypes.SourceUnit,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) => new SourceUnitNode(sourceUnit, uri, rootPath, documentsAnalyzer),
  PragmaDirective: (
    pragmaDirective: astTypes.PragmaDirective,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) =>
    new PragmaDirectiveNode(pragmaDirective, uri, rootPath, documentsAnalyzer),
  ImportDirective: (
    importDirective: astTypes.ImportDirective,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) =>
    new ImportDirectiveNode(importDirective, uri, rootPath, documentsAnalyzer),
  ContractDefinition: (
    contractDefinition: astTypes.ContractDefinition,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) =>
    new ContractDefinitionNode(
      contractDefinition,
      uri,
      rootPath,
      documentsAnalyzer
    ),
  InheritanceSpecifier: (
    inheritanceSpecifier: astTypes.InheritanceSpecifier,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) =>
    new InheritanceSpecifierNode(
      inheritanceSpecifier,
      uri,
      rootPath,
      documentsAnalyzer
    ),
  StateVariableDeclaration: (
    stateVariableDeclaration: astTypes.StateVariableDeclaration,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) =>
    new StateVariableDeclarationNode(
      stateVariableDeclaration,
      uri,
      rootPath,
      documentsAnalyzer
    ),
  UsingForDeclaration: (
    usingForDeclaration: astTypes.UsingForDeclaration,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) =>
    new UsingForDeclarationNode(
      usingForDeclaration,
      uri,
      rootPath,
      documentsAnalyzer
    ),
  StructDefinition: (
    structDefinition: astTypes.StructDefinition,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) =>
    new StructDefinitionNode(
      structDefinition,
      uri,
      rootPath,
      documentsAnalyzer
    ),
  ModifierDefinition: (
    modifierDefinition: astTypes.ModifierDefinition,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) =>
    new ModifierDefinitionNode(
      modifierDefinition,
      uri,
      rootPath,
      documentsAnalyzer
    ),
  ModifierInvocation: (
    modifierInvocation: astTypes.ModifierInvocation,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) =>
    new ModifierInvocationNode(
      modifierInvocation,
      uri,
      rootPath,
      documentsAnalyzer
    ),
  FunctionDefinition: (
    functionDefinition: astTypes.FunctionDefinition,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) =>
    new FunctionDefinitionNode(
      functionDefinition,
      uri,
      rootPath,
      documentsAnalyzer
    ),
  EventDefinition: (
    eventDefinition: astTypes.EventDefinition,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) =>
    new EventDefinitionNode(eventDefinition, uri, rootPath, documentsAnalyzer),
  EnumValue: (
    enumValue: astTypes.EnumValue,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) => new EnumValueNode(enumValue, uri, rootPath, documentsAnalyzer),
  EnumDefinition: (
    enumDefinition: astTypes.EnumDefinition,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) => new EnumDefinitionNode(enumDefinition, uri, rootPath, documentsAnalyzer),
  VariableDeclaration: (
    variableDeclaration: astTypes.VariableDeclaration,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) =>
    new VariableDeclarationNode(
      variableDeclaration,
      uri,
      rootPath,
      documentsAnalyzer
    ),
  UserDefinedTypeName: (
    userDefinedTypeName: astTypes.UserDefinedTypeName,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) =>
    new UserDefinedTypeNameNode(
      userDefinedTypeName,
      uri,
      rootPath,
      documentsAnalyzer
    ),
  ArrayTypeName: (
    arrayTypeName: astTypes.ArrayTypeName,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) => new ArrayTypeNameNode(arrayTypeName, uri, rootPath, documentsAnalyzer),
  Mapping: (
    mapping: astTypes.Mapping,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) => new MappingNode(mapping, uri, rootPath, documentsAnalyzer),
  ElementaryTypeName: (
    elementaryTypeName: astTypes.ElementaryTypeName,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) =>
    new ElementaryTypeNameNode(
      elementaryTypeName,
      uri,
      rootPath,
      documentsAnalyzer
    ),
  FunctionTypeName: (
    functionTypeName: astTypes.FunctionTypeName,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) =>
    new FunctionTypeNameNode(
      functionTypeName,
      uri,
      rootPath,
      documentsAnalyzer
    ),
  Block: (
    block: astTypes.Block,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) => new BlockNode(block, uri, rootPath, documentsAnalyzer),
  ExpressionStatement: (
    expressionStatement: astTypes.ExpressionStatement,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) =>
    new ExpressionStatementNode(
      expressionStatement,
      uri,
      rootPath,
      documentsAnalyzer
    ),
  IfStatement: (
    ifStatement: astTypes.IfStatement,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) => new IfStatementNode(ifStatement, uri, rootPath, documentsAnalyzer),
  UncheckedStatement: (
    uncheckedStatement: astTypes.UncheckedStatement,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) =>
    new UncheckedStatementNode(
      uncheckedStatement,
      uri,
      rootPath,
      documentsAnalyzer
    ),
  WhileStatement: (
    whileStatement: astTypes.WhileStatement,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) => new WhileStatementNode(whileStatement, uri, rootPath, documentsAnalyzer),
  ForStatement: (
    forStatement: astTypes.ForStatement,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) => new ForStatementNode(forStatement, uri, rootPath, documentsAnalyzer),
  InlineAssemblyStatement: (
    inlineAssemblyStatement: astTypes.InlineAssemblyStatement,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) =>
    new InlineAssemblyStatementNode(
      inlineAssemblyStatement,
      uri,
      rootPath,
      documentsAnalyzer
    ),
  DoWhileStatement: (
    doWhileStatement: astTypes.DoWhileStatement,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) =>
    new DoWhileStatementNode(
      doWhileStatement,
      uri,
      rootPath,
      documentsAnalyzer
    ),
  ContinueStatement: (
    continueStatement: astTypes.ContinueStatement,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) =>
    new ContinueStatementNode(
      continueStatement,
      uri,
      rootPath,
      documentsAnalyzer
    ),
  Break: (
    astBreak: astTypes.Break,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) => new BreakNode(astBreak, uri, rootPath, documentsAnalyzer),
  Continue: (
    astContinue: astTypes.Continue,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) => new ContinueNode(astContinue, uri, rootPath, documentsAnalyzer),
  BreakStatement: (
    breakStatement: astTypes.BreakStatement,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) => new BreakStatementNode(breakStatement, uri, rootPath, documentsAnalyzer),
  ReturnStatement: (
    returnStatement: astTypes.ReturnStatement,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) =>
    new ReturnStatementNode(returnStatement, uri, rootPath, documentsAnalyzer),
  EmitStatement: (
    emitStatement: astTypes.EmitStatement,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) => new EmitStatementNode(emitStatement, uri, rootPath, documentsAnalyzer),
  ThrowStatement: (
    throwStatement: astTypes.ThrowStatement,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) => new ThrowStatementNode(throwStatement, uri, rootPath, documentsAnalyzer),
  VariableDeclarationStatement: (
    variableDeclarationStatement: astTypes.VariableDeclarationStatement,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) =>
    new VariableDeclarationStatementNode(
      variableDeclarationStatement,
      uri,
      rootPath,
      documentsAnalyzer
    ),
  FunctionCall: (
    functionCall: astTypes.FunctionCall,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) => new FunctionCallNode(functionCall, uri, rootPath, documentsAnalyzer),
  AssemblyBlock: (
    assemblyBlock: astTypes.AssemblyBlock,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) => new AssemblyBlockNode(assemblyBlock, uri, rootPath, documentsAnalyzer),
  AssemblyCall: (
    assemblyCall: astTypes.AssemblyCall,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) => new AssemblyCallNode(assemblyCall, uri, rootPath, documentsAnalyzer),
  AssemblyLocalDefinition: (
    assemblyLocalDefinition: astTypes.AssemblyLocalDefinition,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) =>
    new AssemblyLocalDefinitionNode(
      assemblyLocalDefinition,
      uri,
      rootPath,
      documentsAnalyzer
    ),
  AssemblyAssignment: (
    assemblyAssignment: astTypes.AssemblyAssignment,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) =>
    new AssemblyAssignmentNode(
      assemblyAssignment,
      uri,
      rootPath,
      documentsAnalyzer
    ),
  AssemblyStackAssignment: (
    assemblyStackAssignment: astTypes.AssemblyStackAssignment,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) =>
    new AssemblyStackAssignmentNode(
      assemblyStackAssignment,
      uri,
      rootPath,
      documentsAnalyzer
    ),
  LabelDefinition: (
    labelDefinition: astTypes.LabelDefinition,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) =>
    new LabelDefinitionNode(labelDefinition, uri, rootPath, documentsAnalyzer),
  AssemblySwitch: (
    assemblySwitch: astTypes.AssemblySwitch,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) => new AssemblySwitchNode(assemblySwitch, uri, rootPath, documentsAnalyzer),
  AssemblyCase: (
    assemblyCase: astTypes.AssemblyCase,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) => new AssemblyCaseNode(assemblyCase, uri, rootPath, documentsAnalyzer),
  AssemblyFunctionDefinition: (
    assemblyFunctionDefinition: astTypes.AssemblyFunctionDefinition,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) =>
    new AssemblyFunctionDefinitionNode(
      assemblyFunctionDefinition,
      uri,
      rootPath,
      documentsAnalyzer
    ),
  AssemblyFunctionReturns: (
    assemblyFunctionReturns: astTypes.AssemblyFunctionReturns,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) =>
    new AssemblyFunctionReturnsNode(
      assemblyFunctionReturns,
      uri,
      rootPath,
      documentsAnalyzer
    ),
  AssemblyFor: (
    assemblyFor: astTypes.AssemblyFor,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) => new AssemblyForNode(assemblyFor, uri, rootPath, documentsAnalyzer),
  AssemblyIf: (
    assemblyIf: astTypes.AssemblyIf,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) => new AssemblyIfNode(assemblyIf, uri, rootPath, documentsAnalyzer),
  SubAssembly: (
    subAssembly: astTypes.SubAssembly,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) => new SubAssemblyNode(subAssembly, uri, rootPath, documentsAnalyzer),
  NewExpression: (
    newExpression: astTypes.NewExpression,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) => new NewExpressionNode(newExpression, uri, rootPath, documentsAnalyzer),
  TupleExpression: (
    tupleExpression: astTypes.TupleExpression,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) =>
    new TupleExpressionNode(tupleExpression, uri, rootPath, documentsAnalyzer),
  TypeNameExpression: (
    typeNameExpression: astTypes.TypeNameExpression,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) =>
    new TypeNameExpressionNode(
      typeNameExpression,
      uri,
      rootPath,
      documentsAnalyzer
    ),
  NameValueExpression: (
    nameValueExpression: astTypes.NameValueExpression,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) =>
    new NameValueExpressionNode(
      nameValueExpression,
      uri,
      rootPath,
      documentsAnalyzer
    ),
  NumberLiteral: (
    numberLiteral: astTypes.NumberLiteral,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) => new NumberLiteralNode(numberLiteral, uri, rootPath, documentsAnalyzer),
  BooleanLiteral: (
    booleanLiteral: astTypes.BooleanLiteral,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) => new BooleanLiteralNode(booleanLiteral, uri, rootPath, documentsAnalyzer),
  HexLiteral: (
    hexLiteral: astTypes.HexLiteral,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) => new HexLiteralNode(hexLiteral, uri, rootPath, documentsAnalyzer),
  StringLiteral: (
    stringLiteral: astTypes.StringLiteral,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) => new StringLiteralNode(stringLiteral, uri, rootPath, documentsAnalyzer),
  Identifier: (
    identifier: astTypes.Identifier,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) => new IdentifierNode(identifier, uri, rootPath, documentsAnalyzer),
  BinaryOperation: (
    binaryOperation: astTypes.BinaryOperation,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) =>
    new BinaryOperationNode(binaryOperation, uri, rootPath, documentsAnalyzer),
  UnaryOperation: (
    unaryOperation: astTypes.UnaryOperation,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) => new UnaryOperationNode(unaryOperation, uri, rootPath, documentsAnalyzer),
  Conditional: (
    conditional: astTypes.Conditional,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) => new ConditionalNode(conditional, uri, rootPath, documentsAnalyzer),
  IndexAccess: (
    indexAccess: astTypes.IndexAccess,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) => new IndexAccessNode(indexAccess, uri, rootPath, documentsAnalyzer),
  IndexRangeAccess: (
    indexRangeAccess: astTypes.IndexRangeAccess,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) =>
    new IndexRangeAccessNode(
      indexRangeAccess,
      uri,
      rootPath,
      documentsAnalyzer
    ),
  MemberAccess: (
    memberAccess: astTypes.MemberAccess,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) => new MemberAccessNode(memberAccess, uri, rootPath, documentsAnalyzer),
  HexNumber: (
    hexNumber: astTypes.HexNumber,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) => new HexNumberNode(hexNumber, uri, rootPath, documentsAnalyzer),
  DecimalNumber: (
    decimalNumber: astTypes.DecimalNumber,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) => new DecimalNumberNode(decimalNumber, uri, rootPath, documentsAnalyzer),
  TryStatement: (
    tryStatement: astTypes.TryStatement,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) => new TryStatementNode(tryStatement, uri, rootPath, documentsAnalyzer),
  NameValueList: (
    nameValueList: astTypes.NameValueList,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) => new NameValueListNode(nameValueList, uri, rootPath, documentsAnalyzer),
  AssemblyMemberAccess: (
    assemblyMemberAccess: astTypes.AssemblyMemberAccess,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) =>
    new AssemblyMemberAccessNode(
      assemblyMemberAccess,
      uri,
      rootPath,
      documentsAnalyzer
    ),
  CatchClause: (
    catchClause: astTypes.CatchClause,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) => new CatchClauseNode(catchClause, uri, rootPath, documentsAnalyzer),
  FileLevelConstant: (
    fileLevelConstant: astTypes.FileLevelConstant,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) =>
    new FileLevelConstantNode(
      fileLevelConstant,
      uri,
      rootPath,
      documentsAnalyzer
    ),
  CustomErrorDefinition: (
    customErrorDefinition: astTypes.CustomErrorDefinition,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) =>
    new CustomErrorDefinitionNode(
      customErrorDefinition,
      uri,
      rootPath,
      documentsAnalyzer
    ),
  RevertStatement: (
    revertStatement: astTypes.RevertStatement,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) =>
    new RevertStatementNode(revertStatement, uri, rootPath, documentsAnalyzer),
  TypeDefinition: (
    typeDefinition: astTypes.TypeDefinition,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) => new TypeDefinitionNode(typeDefinition, uri, rootPath, documentsAnalyzer),
});
