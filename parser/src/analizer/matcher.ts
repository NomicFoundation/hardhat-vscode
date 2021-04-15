import * as astTypes from "@solidity-parser/parser/dist/ast-types";

import { SourceUnitNode } from "./nodes/SourceUnitNode";
import { PragmaDirectiveNode } from "./nodes/PragmaDirectiveNode";
import { ImportDirectiveNode } from "./nodes/ImportDirectiveNode";
import { ContractDefinitionNode } from "./nodes/ContractDefinitionNode";
import { InheritanceSpecifierNode } from "./nodes/InheritanceSpecifierNode";
import { StateVariableDeclarationNode } from "./nodes/StateVariableDeclarationNode";
import { UsingForDeclarationNode } from "./nodes/UsingForDeclarationNode";
import { StructDefinitionNode } from "./nodes/StructDefinitionNode";
import { ModifierDefinitionNode } from "./nodes/ModifierDefinitionNode";
import { ModifierInvocationNode } from "./nodes/ModifierInvocationNode";
import { FunctionDefinitionNode } from "./nodes/FunctionDefinitionNode";
import { EventDefinitionNode } from "./nodes/EventDefinitionNode";
import { EnumValueNode } from "./nodes/EnumValueNode";
import { EnumDefinitionNode } from "./nodes/EnumDefinitionNode";
import { VariableDeclarationNode } from "./nodes/VariableDeclarationNode";
import { UserDefinedTypeNameNode } from "./nodes/UserDefinedTypeNameNode";
import { ArrayTypeNameNode } from "./nodes/ArrayTypeNameNode";
import { MappingNode } from "./nodes/MappingNode";
import { ElementaryTypeNameNode } from "./nodes/ElementaryTypeNameNode";
import { FunctionTypeNameNode } from "./nodes/FunctionTypeNameNode";
import { BlockNode } from "./nodes/BlockNode";
import { ExpressionStatementNode } from "./nodes/ExpressionStatementNode";
import { IfStatementNode } from "./nodes/IfStatementNode";
import { UncheckedStatementNode } from "./nodes/UncheckedStatementNode";
import { WhileStatementNode } from "./nodes/WhileStatementNode";
import { ForStatementNode } from "./nodes/ForStatementNode";
import { InlineAssemblyStatementNode } from "./nodes/InlineAssemblyStatementNode";
import { DoWhileStatementNode } from "./nodes/DoWhileStatementNode";
import { ContinueStatementNode } from "./nodes/ContinueStatementNode";
import { BreakNode } from "./nodes/BreakNode";
import { ContinueNode } from "./nodes/ContinueNode";
import { BreakStatementNode } from "./nodes/BreakStatementNode";
import { ReturnStatementNode } from "./nodes/ReturnStatementNode";
import { EmitStatementNode } from "./nodes/EmitStatementNode";
import { ThrowStatementNode } from "./nodes/ThrowStatementNode";
import { VariableDeclarationStatementNode } from "./nodes/VariableDeclarationStatementNode";
import { FunctionCallNode } from "./nodes/FunctionCallNode";
import { AssemblyBlockNode } from "./nodes/AssemblyBlockNode";
import { AssemblyCallNode } from "./nodes/AssemblyCallNode";
import { AssemblyLocalDefinitionNode } from "./nodes/AssemblyLocalDefinitionNode";
import { AssemblyAssignmentNode } from "./nodes/AssemblyAssignmentNode";
import { AssemblyStackAssignmentNode } from "./nodes/AssemblyStackAssignmentNode";
import { LabelDefinitionNode } from "./nodes/LabelDefinitionNode";
import { AssemblySwitchNode } from "./nodes/AssemblySwitchNode";
import { AssemblyCaseNode } from "./nodes/AssemblyCaseNode";
import { AssemblyFunctionDefinitionNode } from "./nodes/AssemblyFunctionDefinitionNode";
import { AssemblyFunctionReturnsNode } from "./nodes/AssemblyFunctionReturnsNode";
import { AssemblyForNode } from "./nodes/AssemblyForNode";
import { AssemblyIfNode } from "./nodes/AssemblyIfNode";
import { AssemblyLiteralNode } from "./nodes/AssemblyLiteralNode";
import { SubAssemblyNode } from "./nodes/SubAssemblyNode";
import { NewExpressionNode } from "./nodes/NewExpressionNode";
import { TupleExpressionNode } from "./nodes/TupleExpressionNode";
import { TypeNameExpressionNode } from "./nodes/TypeNameExpressionNode";
import { NameValueExpressionNode } from "./nodes/NameValueExpressionNode";
import { NumberLiteralNode } from "./nodes/NumberLiteralNode";
import { BooleanLiteralNode } from "./nodes/BooleanLiteralNode";
import { HexLiteralNode } from "./nodes/HexLiteralNode";
import { StringLiteralNode } from "./nodes/StringLiteralNode";
import { IdentifierNode } from "./nodes/IdentifierNode";
import { BinaryOperationNode } from "./nodes/BinaryOperationNode";
import { UnaryOperationNode } from "./nodes/UnaryOperationNode";
import { ConditionalNode } from "./nodes/ConditionalNode";
import { IndexAccessNode } from "./nodes/IndexAccessNode";
import { IndexRangeAccessNode } from "./nodes/IndexRangeAccessNode";
import { MemberAccessNode } from "./nodes/MemberAccessNode";
import { HexNumberNode } from "./nodes/HexNumberNode";
import { DecimalNumberNode } from "./nodes/DecimalNumberNode";

type ASTTypes = astTypes.AST["type"];
type ASTMap<U> = { [K in ASTTypes]: U extends { type: K } ? U : never };

type ASTTypeMap = ASTMap<astTypes.AST>;
type Pattern<T> = { [K in keyof ASTTypeMap]: (ast: ASTTypeMap[K], uri: string) => T };

function matcher<T>(pattern: Pattern<T>): (ast: astTypes.AST, uri: string) => T {
    return (ast, uri) => pattern[ast.type](ast as any, uri as string)
}

export const find = matcher({
	SourceUnit: (sourceUnit: astTypes.SourceUnit, uri: string) => new SourceUnitNode(sourceUnit, uri),
	PragmaDirective: (pragmaDirective: astTypes.PragmaDirective, uri: string) => new PragmaDirectiveNode(pragmaDirective, uri),
	ImportDirective: (importDirective: astTypes.ImportDirective, uri: string) => new ImportDirectiveNode(importDirective, uri),
	ContractDefinition: (contractDefinition: astTypes.ContractDefinition, uri: string) => new ContractDefinitionNode(contractDefinition, uri),
	InheritanceSpecifier: (inheritanceSpecifier: astTypes.InheritanceSpecifier, uri: string) => new InheritanceSpecifierNode(inheritanceSpecifier, uri),
	StateVariableDeclaration: (stateVariableDeclaration: astTypes.StateVariableDeclaration, uri: string) => new StateVariableDeclarationNode(stateVariableDeclaration, uri),
	UsingForDeclaration: (usingForDeclaration: astTypes.UsingForDeclaration, uri: string) => new UsingForDeclarationNode(usingForDeclaration, uri),
	StructDefinition: (structDefinition: astTypes.StructDefinition, uri: string) => new StructDefinitionNode(structDefinition, uri),
	ModifierDefinition: (modifierDefinition: astTypes.ModifierDefinition, uri: string) => new ModifierDefinitionNode(modifierDefinition, uri),
	ModifierInvocation: (modifierInvocation: astTypes.ModifierInvocation, uri: string) => new ModifierInvocationNode(modifierInvocation, uri),
	FunctionDefinition: (functionDefinition: astTypes.FunctionDefinition, uri: string) => new FunctionDefinitionNode(functionDefinition, uri),
	EventDefinition: (eventDefinition: astTypes.EventDefinition, uri: string) => new EventDefinitionNode(eventDefinition, uri),
	EnumValue: (enumValue: astTypes.EnumValue, uri: string) => new EnumValueNode(enumValue, uri),
	EnumDefinition: (enumDefinition: astTypes.EnumDefinition, uri: string) => new EnumDefinitionNode(enumDefinition, uri),
	VariableDeclaration: (variableDeclaration: astTypes.VariableDeclaration, uri: string) => new VariableDeclarationNode(variableDeclaration, uri),
	UserDefinedTypeName: (userDefinedTypeName: astTypes.UserDefinedTypeName, uri: string) => new UserDefinedTypeNameNode(userDefinedTypeName, uri),
	ArrayTypeName: (arrayTypeName: astTypes.ArrayTypeName, uri: string) => new ArrayTypeNameNode(arrayTypeName, uri),
	Mapping: (mapping: astTypes.Mapping, uri: string) => new MappingNode(mapping, uri),
	ElementaryTypeName: (elementaryTypeName: astTypes.ElementaryTypeName, uri: string) => new ElementaryTypeNameNode(elementaryTypeName, uri),
	FunctionTypeName: (functionTypeName: astTypes.FunctionTypeName, uri: string) => new FunctionTypeNameNode(functionTypeName, uri),
	Block: (block: astTypes.Block, uri: string) => new BlockNode(block, uri),
	ExpressionStatement: (expressionStatement: astTypes.ExpressionStatement, uri: string) => new ExpressionStatementNode(expressionStatement, uri),
	IfStatement: (ifStatement: astTypes.IfStatement, uri: string) => new IfStatementNode(ifStatement, uri),
	UncheckedStatement: (uncheckedStatement: astTypes.UncheckedStatement, uri: string) => new UncheckedStatementNode(uncheckedStatement, uri),
	WhileStatement: (whileStatement: astTypes.WhileStatement, uri: string) => new WhileStatementNode(whileStatement, uri),
	ForStatement: (forStatement: astTypes.ForStatement, uri: string) => new ForStatementNode(forStatement, uri),
	InlineAssemblyStatement: (inlineAssemblyStatement: astTypes.InlineAssemblyStatement, uri: string) => new InlineAssemblyStatementNode(inlineAssemblyStatement, uri),
	DoWhileStatement: (doWhileStatement: astTypes.DoWhileStatement, uri: string) => new DoWhileStatementNode(doWhileStatement, uri),
	ContinueStatement: (continueStatement: astTypes.ContinueStatement, uri: string) => new ContinueStatementNode(continueStatement, uri),
	Break: (breakType: astTypes.Break, uri: string) => new BreakNode(breakType, uri),
	Continue: (continueType: astTypes.Continue, uri: string) => new ContinueNode(continueType, uri),
	BreakStatement: (breakStatement: astTypes.BreakStatement, uri: string) => new BreakStatementNode(breakStatement, uri),
	ReturnStatement: (returnStatement: astTypes.ReturnStatement, uri: string) => new ReturnStatementNode(returnStatement, uri),
	EmitStatement: (emitStatement: astTypes.EmitStatement, uri: string) => new EmitStatementNode(emitStatement, uri),
	ThrowStatement: (throwStatement: astTypes.ThrowStatement, uri: string) => new ThrowStatementNode(throwStatement, uri),
	VariableDeclarationStatement: (variableDeclarationStatement: astTypes.VariableDeclarationStatement, uri: string) => new VariableDeclarationStatementNode(variableDeclarationStatement, uri),
	FunctionCall: (functionCall: astTypes.FunctionCall, uri: string) => new FunctionCallNode(functionCall, uri),
	AssemblyBlock: (assemblyBlock: astTypes.AssemblyBlock, uri: string) => new AssemblyBlockNode(assemblyBlock, uri),
	AssemblyCall: (assemblyCall: astTypes.AssemblyCall, uri: string) => new AssemblyCallNode(assemblyCall, uri),
	AssemblyLocalDefinition: (assemblyLocalDefinition: astTypes.AssemblyLocalDefinition, uri: string) => new AssemblyLocalDefinitionNode(assemblyLocalDefinition, uri),
	AssemblyAssignment: (assemblyAssignment: astTypes.AssemblyAssignment, uri: string) => new AssemblyAssignmentNode(assemblyAssignment, uri),
	AssemblyStackAssignment: (assemblyStackAssignment: astTypes.AssemblyStackAssignment, uri: string) => new AssemblyStackAssignmentNode(assemblyStackAssignment, uri),
	LabelDefinition: (labelDefinition: astTypes.LabelDefinition, uri: string) => new LabelDefinitionNode(labelDefinition, uri),
	AssemblySwitch: (assemblySwitch: astTypes.AssemblySwitch, uri: string) => new AssemblySwitchNode(assemblySwitch, uri),
	AssemblyCase: (assemblyCase: astTypes.AssemblyCase, uri: string) => new AssemblyCaseNode(assemblyCase, uri),
	AssemblyFunctionDefinition: (assemblyFunctionDefinition: astTypes.AssemblyFunctionDefinition, uri: string) => new AssemblyFunctionDefinitionNode(assemblyFunctionDefinition, uri),
	AssemblyFunctionReturns: (assemblyFunctionReturns: astTypes.AssemblyFunctionReturns, uri: string) => new AssemblyFunctionReturnsNode(assemblyFunctionReturns, uri),
	AssemblyFor: (assemblyFor: astTypes.AssemblyFor, uri: string) => new AssemblyForNode(assemblyFor, uri),
	AssemblyIf: (assemblyIf: astTypes.AssemblyIf, uri: string) => new AssemblyIfNode(assemblyIf, uri),
	AssemblyLiteral: (assemblyLiteral: astTypes.AssemblyLiteral, uri: string) => new AssemblyLiteralNode(assemblyLiteral, uri),
	SubAssembly: (subAssembly: astTypes.SubAssembly, uri: string) => new SubAssemblyNode(subAssembly, uri),
	NewExpression: (newExpression: astTypes.NewExpression, uri: string) => new NewExpressionNode(newExpression, uri),
	TupleExpression: (tupleExpression: astTypes.TupleExpression, uri: string) => new TupleExpressionNode(tupleExpression, uri),
	TypeNameExpression: (typeNameExpression: astTypes.TypeNameExpression, uri: string) => new TypeNameExpressionNode(typeNameExpression, uri),
	NameValueExpression: (nameValueExpression: astTypes.NameValueExpression, uri: string) => new NameValueExpressionNode(nameValueExpression, uri),
	NumberLiteral: (numberLiteral: astTypes.NumberLiteral, uri: string) => new NumberLiteralNode(numberLiteral, uri),
	BooleanLiteral: (booleanLiteral: astTypes.BooleanLiteral, uri: string) => new BooleanLiteralNode(booleanLiteral, uri),
	HexLiteral: (hexLiteral: astTypes.HexLiteral, uri: string) => new HexLiteralNode(hexLiteral, uri),
	StringLiteral: (stringLiteral: astTypes.StringLiteral, uri: string) => new StringLiteralNode(stringLiteral, uri),
	Identifier: (identifier: astTypes.Identifier, uri: string) => new IdentifierNode(identifier, uri),
	BinaryOperation: (binaryOperation: astTypes.BinaryOperation, uri: string) => new BinaryOperationNode(binaryOperation, uri),
	UnaryOperation: (unaryOperation: astTypes.UnaryOperation, uri: string) => new UnaryOperationNode(unaryOperation, uri),
	Conditional: (conditional: astTypes.Conditional, uri: string) => new ConditionalNode(conditional, uri),
	IndexAccess: (indexAccess: astTypes.IndexAccess, uri: string) => new IndexAccessNode(indexAccess, uri),
	IndexRangeAccess: (indexRangeAccess: astTypes.IndexRangeAccess, uri: string) => new IndexRangeAccessNode(indexRangeAccess, uri),
	MemberAccess: (memberAccess: astTypes.MemberAccess, uri: string) => new MemberAccessNode(memberAccess, uri),
	HexNumber: (hexNumber: astTypes.HexNumber, uri: string) => new HexNumberNode(hexNumber, uri),
	DecimalNumber: (decimalNumber: astTypes.DecimalNumber, uri: string) => new DecimalNumberNode(decimalNumber, uri),
});
