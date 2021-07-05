import * as astTypes from "@solidity-parser/parser/dist/src/ast-types";

import { SourceUnitNode } from "@nodes/SourceUnitNode";
import { PragmaDirectiveNode } from "@nodes/PragmaDirectiveNode";
import { ImportDirectiveNode } from "@nodes/ImportDirectiveNode";
import { ContractDefinitionNode } from "@nodes/ContractDefinitionNode";
import { InheritanceSpecifierNode } from "@nodes/InheritanceSpecifierNode";
import { StateVariableDeclarationNode } from "@nodes/StateVariableDeclarationNode";
import { UsingForDeclarationNode } from "@nodes/UsingForDeclarationNode";
import { StructDefinitionNode } from "@nodes/StructDefinitionNode";
import { ModifierDefinitionNode } from "@nodes/ModifierDefinitionNode";
import { ModifierInvocationNode } from "@nodes/ModifierInvocationNode";
import { FunctionDefinitionNode } from "@nodes/FunctionDefinitionNode";
import { EventDefinitionNode } from "@nodes/EventDefinitionNode";
import { EnumValueNode } from "@nodes/EnumValueNode";
import { EnumDefinitionNode } from "@nodes/EnumDefinitionNode";
import { VariableDeclarationNode } from "@nodes/VariableDeclarationNode";
import { UserDefinedTypeNameNode } from "@nodes/UserDefinedTypeNameNode";
import { ArrayTypeNameNode } from "@nodes/ArrayTypeNameNode";
import { MappingNode } from "@nodes/MappingNode";
import { ElementaryTypeNameNode } from "@nodes/ElementaryTypeNameNode";
import { FunctionTypeNameNode } from "@nodes/FunctionTypeNameNode";
import { BlockNode } from "@nodes/BlockNode";
import { ExpressionStatementNode } from "@nodes/ExpressionStatementNode";
import { IfStatementNode } from "@nodes/IfStatementNode";
import { UncheckedStatementNode } from "@nodes/UncheckedStatementNode";
import { WhileStatementNode } from "@nodes/WhileStatementNode";
import { ForStatementNode } from "@nodes/ForStatementNode";
import { InlineAssemblyStatementNode } from "@nodes/InlineAssemblyStatementNode";
import { DoWhileStatementNode } from "@nodes/DoWhileStatementNode";
import { ContinueStatementNode } from "@nodes/ContinueStatementNode";
import { BreakNode } from "@nodes/BreakNode";
import { ContinueNode } from "@nodes/ContinueNode";
import { BreakStatementNode } from "@nodes/BreakStatementNode";
import { ReturnStatementNode } from "@nodes/ReturnStatementNode";
import { EmitStatementNode } from "@nodes/EmitStatementNode";
import { ThrowStatementNode } from "@nodes/ThrowStatementNode";
import { VariableDeclarationStatementNode } from "@nodes/VariableDeclarationStatementNode";
import { FunctionCallNode } from "@nodes/FunctionCallNode";
import { AssemblyBlockNode } from "@nodes/AssemblyBlockNode";
import { AssemblyCallNode } from "@nodes/AssemblyCallNode";
import { AssemblyLocalDefinitionNode } from "@nodes/AssemblyLocalDefinitionNode";
import { AssemblyAssignmentNode } from "@nodes/AssemblyAssignmentNode";
import { AssemblyStackAssignmentNode } from "@nodes/AssemblyStackAssignmentNode";
import { LabelDefinitionNode } from "@nodes/LabelDefinitionNode";
import { AssemblySwitchNode } from "@nodes/AssemblySwitchNode";
import { AssemblyCaseNode } from "@nodes/AssemblyCaseNode";
import { AssemblyFunctionDefinitionNode } from "@nodes/AssemblyFunctionDefinitionNode";
import { AssemblyFunctionReturnsNode } from "@nodes/AssemblyFunctionReturnsNode";
import { AssemblyForNode } from "@nodes/AssemblyForNode";
import { AssemblyIfNode } from "@nodes/AssemblyIfNode";
import { SubAssemblyNode } from "@nodes/SubAssemblyNode";
import { NewExpressionNode } from "@nodes/NewExpressionNode";
import { TupleExpressionNode } from "@nodes/TupleExpressionNode";
import { TypeNameExpressionNode } from "@nodes/TypeNameExpressionNode";
import { NameValueExpressionNode } from "@nodes/NameValueExpressionNode";
import { NumberLiteralNode } from "@nodes/NumberLiteralNode";
import { BooleanLiteralNode } from "@nodes/BooleanLiteralNode";
import { HexLiteralNode } from "@nodes/HexLiteralNode";
import { StringLiteralNode } from "@nodes/StringLiteralNode";
import { IdentifierNode } from "@nodes/IdentifierNode";
import { BinaryOperationNode } from "@nodes/BinaryOperationNode";
import { UnaryOperationNode } from "@nodes/UnaryOperationNode";
import { ConditionalNode } from "@nodes/ConditionalNode";
import { IndexAccessNode } from "@nodes/IndexAccessNode";
import { IndexRangeAccessNode } from "@nodes/IndexRangeAccessNode";
import { MemberAccessNode } from "@nodes/MemberAccessNode";
import { HexNumberNode } from "@nodes/HexNumberNode";
import { DecimalNumberNode } from "@nodes/DecimalNumberNode";
import { TryStatementNode } from "@nodes/TryStatementNode";
import { NameValueListNode } from "@nodes/NameValueListNode";
import { AssemblyMemberAccessNode } from "@nodes/AssemblyMemberAccessNode";
import { CatchClauseNode } from "@nodes/CatchClauseNode";
import { FileLevelConstantNode } from "@nodes/FileLevelConstantNode";
import { CustomErrorDefinitionNode } from "@nodes/CustomErrorDefinitionNode";
import { RevertStatementNode } from "@nodes/RevertStatementNode";

import { Node } from "@nodes/Node";

type ASTTypes = astTypes.ASTNode["type"];
type ASTMap<U> = { [K in ASTTypes]: U extends { type: K } ? U : never };

type ASTTypeMap = ASTMap<astTypes.ASTNode>;
type Pattern<T> = { [K in keyof ASTTypeMap]: (ast: ASTTypeMap[K], uri: string, rootPath: string) => T };

function matcher<T>(pattern: Pattern<T>): (ast: astTypes.BaseASTNode, uri: string, rootPath: string) => T {
    return (ast, uri, rootPath) => pattern[ast.type](ast as any, uri as string, rootPath as string);
}

export const find = matcher<Node>({
	SourceUnit: (sourceUnit: astTypes.SourceUnit, uri: string, rootPath: string) => new SourceUnitNode(sourceUnit, uri, rootPath),
	PragmaDirective: (pragmaDirective: astTypes.PragmaDirective, uri: string, rootPath: string) => new PragmaDirectiveNode(pragmaDirective, uri, rootPath),
	ImportDirective: (importDirective: astTypes.ImportDirective, uri: string, rootPath: string) => new ImportDirectiveNode(importDirective, uri, rootPath),
	ContractDefinition: (contractDefinition: astTypes.ContractDefinition, uri: string, rootPath: string) => new ContractDefinitionNode(contractDefinition, uri, rootPath),
	InheritanceSpecifier: (inheritanceSpecifier: astTypes.InheritanceSpecifier, uri: string, rootPath: string) => new InheritanceSpecifierNode(inheritanceSpecifier, uri, rootPath),
	StateVariableDeclaration: (stateVariableDeclaration: astTypes.StateVariableDeclaration, uri: string, rootPath: string) => new StateVariableDeclarationNode(stateVariableDeclaration, uri, rootPath),
	UsingForDeclaration: (usingForDeclaration: astTypes.UsingForDeclaration, uri: string, rootPath: string) => new UsingForDeclarationNode(usingForDeclaration, uri, rootPath),
	StructDefinition: (structDefinition: astTypes.StructDefinition, uri: string, rootPath: string) => new StructDefinitionNode(structDefinition, uri, rootPath),
	ModifierDefinition: (modifierDefinition: astTypes.ModifierDefinition, uri: string, rootPath: string) => new ModifierDefinitionNode(modifierDefinition, uri, rootPath),
	ModifierInvocation: (modifierInvocation: astTypes.ModifierInvocation, uri: string, rootPath: string) => new ModifierInvocationNode(modifierInvocation, uri, rootPath),
	FunctionDefinition: (functionDefinition: astTypes.FunctionDefinition, uri: string, rootPath: string) => new FunctionDefinitionNode(functionDefinition, uri, rootPath),
	EventDefinition: (eventDefinition: astTypes.EventDefinition, uri: string, rootPath: string) => new EventDefinitionNode(eventDefinition, uri, rootPath),
	EnumValue: (enumValue: astTypes.EnumValue, uri: string, rootPath: string) => new EnumValueNode(enumValue, uri, rootPath),
	EnumDefinition: (enumDefinition: astTypes.EnumDefinition, uri: string, rootPath: string) => new EnumDefinitionNode(enumDefinition, uri, rootPath),
	VariableDeclaration: (variableDeclaration: astTypes.VariableDeclaration, uri: string, rootPath: string) => new VariableDeclarationNode(variableDeclaration, uri, rootPath),
	UserDefinedTypeName: (userDefinedTypeName: astTypes.UserDefinedTypeName, uri: string, rootPath: string) => new UserDefinedTypeNameNode(userDefinedTypeName, uri, rootPath),
	ArrayTypeName: (arrayTypeName: astTypes.ArrayTypeName, uri: string, rootPath: string) => new ArrayTypeNameNode(arrayTypeName, uri, rootPath),
	Mapping: (mapping: astTypes.Mapping, uri: string, rootPath: string) => new MappingNode(mapping, uri, rootPath),
	ElementaryTypeName: (elementaryTypeName: astTypes.ElementaryTypeName, uri: string, rootPath: string) => new ElementaryTypeNameNode(elementaryTypeName, uri, rootPath),
	FunctionTypeName: (functionTypeName: astTypes.FunctionTypeName, uri: string, rootPath: string) => new FunctionTypeNameNode(functionTypeName, uri, rootPath),
	Block: (block: astTypes.Block, uri: string, rootPath: string) => new BlockNode(block, uri, rootPath),
	ExpressionStatement: (expressionStatement: astTypes.ExpressionStatement, uri: string, rootPath: string) => new ExpressionStatementNode(expressionStatement, uri, rootPath),
	IfStatement: (ifStatement: astTypes.IfStatement, uri: string, rootPath: string) => new IfStatementNode(ifStatement, uri, rootPath),
	UncheckedStatement: (uncheckedStatement: astTypes.UncheckedStatement, uri: string, rootPath: string) => new UncheckedStatementNode(uncheckedStatement, uri, rootPath),
	WhileStatement: (whileStatement: astTypes.WhileStatement, uri: string, rootPath: string) => new WhileStatementNode(whileStatement, uri, rootPath),
	ForStatement: (forStatement: astTypes.ForStatement, uri: string, rootPath: string) => new ForStatementNode(forStatement, uri, rootPath),
	InlineAssemblyStatement: (inlineAssemblyStatement: astTypes.InlineAssemblyStatement, uri: string, rootPath: string) => new InlineAssemblyStatementNode(inlineAssemblyStatement, uri, rootPath),
	DoWhileStatement: (doWhileStatement: astTypes.DoWhileStatement, uri: string, rootPath: string) => new DoWhileStatementNode(doWhileStatement, uri, rootPath),
	ContinueStatement: (continueStatement: astTypes.ContinueStatement, uri: string, rootPath: string) => new ContinueStatementNode(continueStatement, uri, rootPath),
	Break: (astBreak: astTypes.Break, uri: string, rootPath: string) => new BreakNode(astBreak, uri, rootPath),
	Continue: (astContinue: astTypes.Continue, uri: string, rootPath: string) => new ContinueNode(astContinue, uri, rootPath),
	BreakStatement: (breakStatement: astTypes.BreakStatement, uri: string, rootPath: string) => new BreakStatementNode(breakStatement, uri, rootPath),
	ReturnStatement: (returnStatement: astTypes.ReturnStatement, uri: string, rootPath: string) => new ReturnStatementNode(returnStatement, uri, rootPath),
	EmitStatement: (emitStatement: astTypes.EmitStatement, uri: string, rootPath: string) => new EmitStatementNode(emitStatement, uri, rootPath),
	ThrowStatement: (throwStatement: astTypes.ThrowStatement, uri: string, rootPath: string) => new ThrowStatementNode(throwStatement, uri, rootPath),
	VariableDeclarationStatement: (variableDeclarationStatement: astTypes.VariableDeclarationStatement, uri: string, rootPath: string) => new VariableDeclarationStatementNode(variableDeclarationStatement, uri, rootPath),
	FunctionCall: (functionCall: astTypes.FunctionCall, uri: string, rootPath: string) => new FunctionCallNode(functionCall, uri, rootPath),
	AssemblyBlock: (assemblyBlock: astTypes.AssemblyBlock, uri: string, rootPath: string) => new AssemblyBlockNode(assemblyBlock, uri, rootPath),
	AssemblyCall: (assemblyCall: astTypes.AssemblyCall, uri: string, rootPath: string) => new AssemblyCallNode(assemblyCall, uri, rootPath),
	AssemblyLocalDefinition: (assemblyLocalDefinition: astTypes.AssemblyLocalDefinition, uri: string, rootPath: string) => new AssemblyLocalDefinitionNode(assemblyLocalDefinition, uri, rootPath),
	AssemblyAssignment: (assemblyAssignment: astTypes.AssemblyAssignment, uri: string, rootPath: string) => new AssemblyAssignmentNode(assemblyAssignment, uri, rootPath),
	AssemblyStackAssignment: (assemblyStackAssignment: astTypes.AssemblyStackAssignment, uri: string, rootPath: string) => new AssemblyStackAssignmentNode(assemblyStackAssignment, uri, rootPath),
	LabelDefinition: (labelDefinition: astTypes.LabelDefinition, uri: string, rootPath: string) => new LabelDefinitionNode(labelDefinition, uri, rootPath),
	AssemblySwitch: (assemblySwitch: astTypes.AssemblySwitch, uri: string, rootPath: string) => new AssemblySwitchNode(assemblySwitch, uri, rootPath),
	AssemblyCase: (assemblyCase: astTypes.AssemblyCase, uri: string, rootPath: string) => new AssemblyCaseNode(assemblyCase, uri, rootPath),
	AssemblyFunctionDefinition: (assemblyFunctionDefinition: astTypes.AssemblyFunctionDefinition, uri: string, rootPath: string) => new AssemblyFunctionDefinitionNode(assemblyFunctionDefinition, uri, rootPath),
	AssemblyFunctionReturns: (assemblyFunctionReturns: astTypes.AssemblyFunctionReturns, uri: string, rootPath: string) => new AssemblyFunctionReturnsNode(assemblyFunctionReturns, uri, rootPath),
	AssemblyFor: (assemblyFor: astTypes.AssemblyFor, uri: string, rootPath: string) => new AssemblyForNode(assemblyFor, uri, rootPath),
	AssemblyIf: (assemblyIf: astTypes.AssemblyIf, uri: string, rootPath: string) => new AssemblyIfNode(assemblyIf, uri, rootPath),
	SubAssembly: (subAssembly: astTypes.SubAssembly, uri: string, rootPath: string) => new SubAssemblyNode(subAssembly, uri, rootPath),
	NewExpression: (newExpression: astTypes.NewExpression, uri: string, rootPath: string) => new NewExpressionNode(newExpression, uri, rootPath),
	TupleExpression: (tupleExpression: astTypes.TupleExpression, uri: string, rootPath: string) => new TupleExpressionNode(tupleExpression, uri, rootPath),
	TypeNameExpression: (typeNameExpression: astTypes.TypeNameExpression, uri: string, rootPath: string) => new TypeNameExpressionNode(typeNameExpression, uri, rootPath),
	NameValueExpression: (nameValueExpression: astTypes.NameValueExpression, uri: string, rootPath: string) => new NameValueExpressionNode(nameValueExpression, uri, rootPath),
	NumberLiteral: (numberLiteral: astTypes.NumberLiteral, uri: string, rootPath: string) => new NumberLiteralNode(numberLiteral, uri, rootPath),
	BooleanLiteral: (booleanLiteral: astTypes.BooleanLiteral, uri: string, rootPath: string) => new BooleanLiteralNode(booleanLiteral, uri, rootPath),
	HexLiteral: (hexLiteral: astTypes.HexLiteral, uri: string, rootPath: string) => new HexLiteralNode(hexLiteral, uri, rootPath),
	StringLiteral: (stringLiteral: astTypes.StringLiteral, uri: string, rootPath: string) => new StringLiteralNode(stringLiteral, uri, rootPath),
	Identifier: (identifier: astTypes.Identifier, uri: string, rootPath: string) => new IdentifierNode(identifier, uri, rootPath),
	BinaryOperation: (binaryOperation: astTypes.BinaryOperation, uri: string, rootPath: string) => new BinaryOperationNode(binaryOperation, uri, rootPath),
	UnaryOperation: (unaryOperation: astTypes.UnaryOperation, uri: string, rootPath: string) => new UnaryOperationNode(unaryOperation, uri, rootPath),
	Conditional: (conditional: astTypes.Conditional, uri: string, rootPath: string) => new ConditionalNode(conditional, uri, rootPath),
	IndexAccess: (indexAccess: astTypes.IndexAccess, uri: string, rootPath: string) => new IndexAccessNode(indexAccess, uri, rootPath),
	IndexRangeAccess: (indexRangeAccess: astTypes.IndexRangeAccess, uri: string, rootPath: string) => new IndexRangeAccessNode(indexRangeAccess, uri, rootPath),
	MemberAccess: (memberAccess: astTypes.MemberAccess, uri: string, rootPath: string) => new MemberAccessNode(memberAccess, uri, rootPath),
	HexNumber: (hexNumber: astTypes.HexNumber, uri: string, rootPath: string) => new HexNumberNode(hexNumber, uri, rootPath),
	DecimalNumber: (decimalNumber: astTypes.DecimalNumber, uri: string, rootPath: string) => new DecimalNumberNode(decimalNumber, uri, rootPath),
	TryStatement: (tryStatement: astTypes.TryStatement, uri: string, rootPath: string) => new TryStatementNode(tryStatement, uri, rootPath),
	NameValueList: (nameValueList: astTypes.NameValueList, uri: string, rootPath: string) => new NameValueListNode(nameValueList, uri, rootPath),
	AssemblyMemberAccess: (assemblyMemberAccess: astTypes.AssemblyMemberAccess, uri: string, rootPath: string) => new AssemblyMemberAccessNode(assemblyMemberAccess, uri, rootPath),
	CatchClause: (catchClause: astTypes.CatchClause, uri: string, rootPath: string) => new CatchClauseNode(catchClause, uri, rootPath),
	FileLevelConstant: (fileLevelConstant: astTypes.FileLevelConstant, uri: string, rootPath: string) => new FileLevelConstantNode(fileLevelConstant, uri, rootPath),
	CustomErrorDefinition: (customErrorDefinition: astTypes.CustomErrorDefinition, uri: string, rootPath: string) => new CustomErrorDefinitionNode(customErrorDefinition, uri, rootPath),
	RevertStatement: (revertStatement: astTypes.RevertStatement, uri: string, rootPath: string) => new RevertStatementNode(revertStatement, uri, rootPath),
});
