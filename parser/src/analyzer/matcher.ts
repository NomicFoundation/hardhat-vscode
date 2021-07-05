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

import { Node, DocumentsAnalyzerMap } from "@common/types";

type ASTTypes = astTypes.ASTNode["type"];
type ASTMap<U> = { [K in ASTTypes]: U extends { type: K } ? U : never };

type ASTTypeMap = ASTMap<astTypes.ASTNode>;
type Pattern<T> = {
	[K in keyof ASTTypeMap]: (
		ast: ASTTypeMap[K],
		uri: string,
		rootPath: string,
		documentsAnalyzer: DocumentsAnalyzerMap
	) => T
};

function matcher<T>(pattern: Pattern<T>): (
		ast: astTypes.BaseASTNode,
		uri: string,
		rootPath: string,
		documentsAnalyzer: DocumentsAnalyzerMap
	) => T {
	return (ast, uri, rootPath, documentsAnalyzer) => pattern[ast.type](
		ast as any,
		uri as string,
		rootPath as string,
		documentsAnalyzer as DocumentsAnalyzerMap
	);
}

export const find = matcher<Node>({
	SourceUnit: (sourceUnit: astTypes.SourceUnit, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new SourceUnitNode(sourceUnit, uri, rootPath, documentsAnalyzer),
	PragmaDirective: (pragmaDirective: astTypes.PragmaDirective, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new PragmaDirectiveNode(pragmaDirective, uri, rootPath, documentsAnalyzer),
	ImportDirective: (importDirective: astTypes.ImportDirective, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new ImportDirectiveNode(importDirective, uri, rootPath, documentsAnalyzer),
	ContractDefinition: (contractDefinition: astTypes.ContractDefinition, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new ContractDefinitionNode(contractDefinition, uri, rootPath, documentsAnalyzer),
	InheritanceSpecifier: (inheritanceSpecifier: astTypes.InheritanceSpecifier, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new InheritanceSpecifierNode(inheritanceSpecifier, uri, rootPath, documentsAnalyzer),
	StateVariableDeclaration: (stateVariableDeclaration: astTypes.StateVariableDeclaration, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new StateVariableDeclarationNode(stateVariableDeclaration, uri, rootPath, documentsAnalyzer),
	UsingForDeclaration: (usingForDeclaration: astTypes.UsingForDeclaration, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new UsingForDeclarationNode(usingForDeclaration, uri, rootPath, documentsAnalyzer),
	StructDefinition: (structDefinition: astTypes.StructDefinition, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new StructDefinitionNode(structDefinition, uri, rootPath, documentsAnalyzer),
	ModifierDefinition: (modifierDefinition: astTypes.ModifierDefinition, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new ModifierDefinitionNode(modifierDefinition, uri, rootPath, documentsAnalyzer),
	ModifierInvocation: (modifierInvocation: astTypes.ModifierInvocation, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new ModifierInvocationNode(modifierInvocation, uri, rootPath, documentsAnalyzer),
	FunctionDefinition: (functionDefinition: astTypes.FunctionDefinition, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new FunctionDefinitionNode(functionDefinition, uri, rootPath, documentsAnalyzer),
	EventDefinition: (eventDefinition: astTypes.EventDefinition, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new EventDefinitionNode(eventDefinition, uri, rootPath, documentsAnalyzer),
	EnumValue: (enumValue: astTypes.EnumValue, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new EnumValueNode(enumValue, uri, rootPath, documentsAnalyzer),
	EnumDefinition: (enumDefinition: astTypes.EnumDefinition, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new EnumDefinitionNode(enumDefinition, uri, rootPath, documentsAnalyzer),
	VariableDeclaration: (variableDeclaration: astTypes.VariableDeclaration, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new VariableDeclarationNode(variableDeclaration, uri, rootPath, documentsAnalyzer),
	UserDefinedTypeName: (userDefinedTypeName: astTypes.UserDefinedTypeName, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new UserDefinedTypeNameNode(userDefinedTypeName, uri, rootPath, documentsAnalyzer),
	ArrayTypeName: (arrayTypeName: astTypes.ArrayTypeName, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new ArrayTypeNameNode(arrayTypeName, uri, rootPath, documentsAnalyzer),
	Mapping: (mapping: astTypes.Mapping, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new MappingNode(mapping, uri, rootPath, documentsAnalyzer),
	ElementaryTypeName: (elementaryTypeName: astTypes.ElementaryTypeName, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new ElementaryTypeNameNode(elementaryTypeName, uri, rootPath, documentsAnalyzer),
	FunctionTypeName: (functionTypeName: astTypes.FunctionTypeName, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new FunctionTypeNameNode(functionTypeName, uri, rootPath, documentsAnalyzer),
	Block: (block: astTypes.Block, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new BlockNode(block, uri, rootPath, documentsAnalyzer),
	ExpressionStatement: (expressionStatement: astTypes.ExpressionStatement, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new ExpressionStatementNode(expressionStatement, uri, rootPath, documentsAnalyzer),
	IfStatement: (ifStatement: astTypes.IfStatement, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new IfStatementNode(ifStatement, uri, rootPath, documentsAnalyzer),
	UncheckedStatement: (uncheckedStatement: astTypes.UncheckedStatement, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new UncheckedStatementNode(uncheckedStatement, uri, rootPath, documentsAnalyzer),
	WhileStatement: (whileStatement: astTypes.WhileStatement, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new WhileStatementNode(whileStatement, uri, rootPath, documentsAnalyzer),
	ForStatement: (forStatement: astTypes.ForStatement, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new ForStatementNode(forStatement, uri, rootPath, documentsAnalyzer),
	InlineAssemblyStatement: (inlineAssemblyStatement: astTypes.InlineAssemblyStatement, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new InlineAssemblyStatementNode(inlineAssemblyStatement, uri, rootPath, documentsAnalyzer),
	DoWhileStatement: (doWhileStatement: astTypes.DoWhileStatement, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new DoWhileStatementNode(doWhileStatement, uri, rootPath, documentsAnalyzer),
	ContinueStatement: (continueStatement: astTypes.ContinueStatement, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new ContinueStatementNode(continueStatement, uri, rootPath, documentsAnalyzer),
	Break: (astBreak: astTypes.Break, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new BreakNode(astBreak, uri, rootPath, documentsAnalyzer),
	Continue: (astContinue: astTypes.Continue, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new ContinueNode(astContinue, uri, rootPath, documentsAnalyzer),
	BreakStatement: (breakStatement: astTypes.BreakStatement, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new BreakStatementNode(breakStatement, uri, rootPath, documentsAnalyzer),
	ReturnStatement: (returnStatement: astTypes.ReturnStatement, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new ReturnStatementNode(returnStatement, uri, rootPath, documentsAnalyzer),
	EmitStatement: (emitStatement: astTypes.EmitStatement, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new EmitStatementNode(emitStatement, uri, rootPath, documentsAnalyzer),
	ThrowStatement: (throwStatement: astTypes.ThrowStatement, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new ThrowStatementNode(throwStatement, uri, rootPath, documentsAnalyzer),
	VariableDeclarationStatement: (variableDeclarationStatement: astTypes.VariableDeclarationStatement, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new VariableDeclarationStatementNode(variableDeclarationStatement, uri, rootPath, documentsAnalyzer),
	FunctionCall: (functionCall: astTypes.FunctionCall, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new FunctionCallNode(functionCall, uri, rootPath, documentsAnalyzer),
	AssemblyBlock: (assemblyBlock: astTypes.AssemblyBlock, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new AssemblyBlockNode(assemblyBlock, uri, rootPath, documentsAnalyzer),
	AssemblyCall: (assemblyCall: astTypes.AssemblyCall, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new AssemblyCallNode(assemblyCall, uri, rootPath, documentsAnalyzer),
	AssemblyLocalDefinition: (assemblyLocalDefinition: astTypes.AssemblyLocalDefinition, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new AssemblyLocalDefinitionNode(assemblyLocalDefinition, uri, rootPath, documentsAnalyzer),
	AssemblyAssignment: (assemblyAssignment: astTypes.AssemblyAssignment, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new AssemblyAssignmentNode(assemblyAssignment, uri, rootPath, documentsAnalyzer),
	AssemblyStackAssignment: (assemblyStackAssignment: astTypes.AssemblyStackAssignment, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new AssemblyStackAssignmentNode(assemblyStackAssignment, uri, rootPath, documentsAnalyzer),
	LabelDefinition: (labelDefinition: astTypes.LabelDefinition, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new LabelDefinitionNode(labelDefinition, uri, rootPath, documentsAnalyzer),
	AssemblySwitch: (assemblySwitch: astTypes.AssemblySwitch, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new AssemblySwitchNode(assemblySwitch, uri, rootPath, documentsAnalyzer),
	AssemblyCase: (assemblyCase: astTypes.AssemblyCase, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new AssemblyCaseNode(assemblyCase, uri, rootPath, documentsAnalyzer),
	AssemblyFunctionDefinition: (assemblyFunctionDefinition: astTypes.AssemblyFunctionDefinition, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new AssemblyFunctionDefinitionNode(assemblyFunctionDefinition, uri, rootPath, documentsAnalyzer),
	AssemblyFunctionReturns: (assemblyFunctionReturns: astTypes.AssemblyFunctionReturns, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new AssemblyFunctionReturnsNode(assemblyFunctionReturns, uri, rootPath, documentsAnalyzer),
	AssemblyFor: (assemblyFor: astTypes.AssemblyFor, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new AssemblyForNode(assemblyFor, uri, rootPath, documentsAnalyzer),
	AssemblyIf: (assemblyIf: astTypes.AssemblyIf, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new AssemblyIfNode(assemblyIf, uri, rootPath, documentsAnalyzer),
	SubAssembly: (subAssembly: astTypes.SubAssembly, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new SubAssemblyNode(subAssembly, uri, rootPath, documentsAnalyzer),
	NewExpression: (newExpression: astTypes.NewExpression, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new NewExpressionNode(newExpression, uri, rootPath, documentsAnalyzer),
	TupleExpression: (tupleExpression: astTypes.TupleExpression, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new TupleExpressionNode(tupleExpression, uri, rootPath, documentsAnalyzer),
	TypeNameExpression: (typeNameExpression: astTypes.TypeNameExpression, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new TypeNameExpressionNode(typeNameExpression, uri, rootPath, documentsAnalyzer),
	NameValueExpression: (nameValueExpression: astTypes.NameValueExpression, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new NameValueExpressionNode(nameValueExpression, uri, rootPath, documentsAnalyzer),
	NumberLiteral: (numberLiteral: astTypes.NumberLiteral, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new NumberLiteralNode(numberLiteral, uri, rootPath, documentsAnalyzer),
	BooleanLiteral: (booleanLiteral: astTypes.BooleanLiteral, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new BooleanLiteralNode(booleanLiteral, uri, rootPath, documentsAnalyzer),
	HexLiteral: (hexLiteral: astTypes.HexLiteral, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new HexLiteralNode(hexLiteral, uri, rootPath, documentsAnalyzer),
	StringLiteral: (stringLiteral: astTypes.StringLiteral, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new StringLiteralNode(stringLiteral, uri, rootPath, documentsAnalyzer),
	Identifier: (identifier: astTypes.Identifier, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new IdentifierNode(identifier, uri, rootPath, documentsAnalyzer),
	BinaryOperation: (binaryOperation: astTypes.BinaryOperation, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new BinaryOperationNode(binaryOperation, uri, rootPath, documentsAnalyzer),
	UnaryOperation: (unaryOperation: astTypes.UnaryOperation, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new UnaryOperationNode(unaryOperation, uri, rootPath, documentsAnalyzer),
	Conditional: (conditional: astTypes.Conditional, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new ConditionalNode(conditional, uri, rootPath, documentsAnalyzer),
	IndexAccess: (indexAccess: astTypes.IndexAccess, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new IndexAccessNode(indexAccess, uri, rootPath, documentsAnalyzer),
	IndexRangeAccess: (indexRangeAccess: astTypes.IndexRangeAccess, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new IndexRangeAccessNode(indexRangeAccess, uri, rootPath, documentsAnalyzer),
	MemberAccess: (memberAccess: astTypes.MemberAccess, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new MemberAccessNode(memberAccess, uri, rootPath, documentsAnalyzer),
	HexNumber: (hexNumber: astTypes.HexNumber, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new HexNumberNode(hexNumber, uri, rootPath, documentsAnalyzer),
	DecimalNumber: (decimalNumber: astTypes.DecimalNumber, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new DecimalNumberNode(decimalNumber, uri, rootPath, documentsAnalyzer),
	TryStatement: (tryStatement: astTypes.TryStatement, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new TryStatementNode(tryStatement, uri, rootPath, documentsAnalyzer),
	NameValueList: (nameValueList: astTypes.NameValueList, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new NameValueListNode(nameValueList, uri, rootPath, documentsAnalyzer),
	AssemblyMemberAccess: (assemblyMemberAccess: astTypes.AssemblyMemberAccess, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new AssemblyMemberAccessNode(assemblyMemberAccess, uri, rootPath, documentsAnalyzer),
	CatchClause: (catchClause: astTypes.CatchClause, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new CatchClauseNode(catchClause, uri, rootPath, documentsAnalyzer),
	FileLevelConstant: (fileLevelConstant: astTypes.FileLevelConstant, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new FileLevelConstantNode(fileLevelConstant, uri, rootPath, documentsAnalyzer),
	CustomErrorDefinition: (customErrorDefinition: astTypes.CustomErrorDefinition, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new CustomErrorDefinitionNode(customErrorDefinition, uri, rootPath, documentsAnalyzer),
	RevertStatement: (revertStatement: astTypes.RevertStatement, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) => new RevertStatementNode(revertStatement, uri, rootPath, documentsAnalyzer),
});
