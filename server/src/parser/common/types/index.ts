import type {
  ASTNode,
  ArrayTypeName,
  AssemblyAssignment,
  AssemblyBlock,
  AssemblyCall,
  AssemblyCase,
  AssemblyFor,
  AssemblyFunctionDefinition,
  AssemblyFunctionReturns,
  AssemblyIf,
  AssemblyLiteral,
  AssemblyLocalDefinition,
  AssemblyMemberAccess,
  AssemblyStackAssignment,
  AssemblySwitch,
  BinaryOperation,
  Block,
  BooleanLiteral,
  Break,
  BreakStatement,
  CatchClause,
  Conditional,
  Continue,
  ContinueStatement,
  ContractDefinition,
  CustomErrorDefinition,
  DecimalNumber,
  DoWhileStatement,
  ElementaryTypeName,
  EmitStatement,
  EnumDefinition,
  EnumValue,
  EventDefinition,
  ExpressionStatement,
  FileLevelConstant,
  ForStatement,
  FunctionCall,
  TypeName,
  FunctionDefinition,
  FunctionTypeName,
  HexLiteral,
  HexNumber,
  Identifier,
  IfStatement,
  ImportDirective,
  IndexAccess,
  IndexRangeAccess,
  InheritanceSpecifier,
  InlineAssemblyStatement,
  LabelDefinition,
  Mapping,
  MemberAccess,
  ModifierDefinition,
  ModifierInvocation,
  NameValueExpression,
  NameValueList,
  NewExpression,
  NumberLiteral,
  PragmaDirective,
  ReturnStatement,
  RevertStatement,
  SourceUnit,
  StateVariableDeclaration,
  StringLiteral,
  StructDefinition,
  SubAssembly,
  ThrowStatement,
  TryStatement,
  TupleExpression,
  TypeNameExpression,
  UnaryOperation,
  UncheckedStatement,
  UserDefinedTypeName,
  UsingForDeclaration,
  VariableDeclaration,
  StateVariableDeclarationVariable,
  VariableDeclarationStatement,
  WhileStatement,
  BaseASTNode,
  TypeDefinition,
} from "@solidity-parser/parser/dist/src/ast-types";

import { WorkspaceFolder } from "vscode-languageserver-protocol";

import {
  Position as VSCodePosition,
  WorkspaceEdit,
  DocumentHighlight,
  TextEdit,
  Range,
  DocumentHighlightKind,
  MarkupKind,
  Definition,
  Hover,
  Location as VSCodeLocation,
  CompletionList,
  CompletionItem,
  CompletionItemKind,
  Diagnostic,
  DiagnosticSeverity,
  SignatureHelp,
  SignatureInformation,
  ParameterInformation,
} from "vscode-languageserver-types";

import { TextDocument } from "vscode-languageserver-textdocument";

export {
  ASTNode,
  ArrayTypeName,
  AssemblyAssignment,
  AssemblyBlock,
  AssemblyCall,
  AssemblyCase,
  AssemblyFor,
  AssemblyFunctionDefinition,
  AssemblyFunctionReturns,
  AssemblyIf,
  AssemblyLiteral,
  AssemblyLocalDefinition,
  AssemblyMemberAccess,
  AssemblyStackAssignment,
  AssemblySwitch,
  BinaryOperation,
  Block,
  BooleanLiteral,
  Break,
  BreakStatement,
  CatchClause,
  Conditional,
  Continue,
  ContinueStatement,
  ContractDefinition,
  CustomErrorDefinition,
  DecimalNumber,
  DoWhileStatement,
  ElementaryTypeName,
  EmitStatement,
  EnumDefinition,
  EnumValue,
  EventDefinition,
  ExpressionStatement,
  FileLevelConstant,
  ForStatement,
  FunctionCall,
  TypeName,
  FunctionDefinition,
  FunctionTypeName,
  HexLiteral,
  HexNumber,
  Identifier,
  IfStatement,
  ImportDirective,
  IndexAccess,
  IndexRangeAccess,
  InheritanceSpecifier,
  InlineAssemblyStatement,
  LabelDefinition,
  Mapping,
  MemberAccess,
  ModifierDefinition,
  ModifierInvocation,
  NameValueExpression,
  NameValueList,
  NewExpression,
  NumberLiteral,
  PragmaDirective,
  ReturnStatement,
  RevertStatement,
  SourceUnit,
  StateVariableDeclaration,
  StringLiteral,
  StructDefinition,
  SubAssembly,
  ThrowStatement,
  TryStatement,
  TupleExpression,
  TypeNameExpression,
  UnaryOperation,
  UncheckedStatement,
  UserDefinedTypeName,
  UsingForDeclaration,
  VariableDeclaration,
  StateVariableDeclarationVariable,
  VariableDeclarationStatement,
  WhileStatement,
  TextDocument,
  VSCodePosition,
  WorkspaceEdit,
  DocumentHighlight,
  TextEdit,
  Range,
  DocumentHighlightKind,
  MarkupKind,
  Definition,
  Hover,
  VSCodeLocation,
  CompletionList,
  CompletionItem,
  CompletionItemKind,
  Diagnostic,
  DiagnosticSeverity,
  SignatureHelp,
  SignatureInformation,
  ParameterInformation,
  TypeDefinition,
};

export interface Searcher {
  /**
   * Default analyzerTree. It is document we are analyzing.
   */
  analyzerTree: { tree: Node };

  /**
   * Searches for a parent definition for the forwarded Node.
   *
   * @param node Node for wich we are looking for a parent.
   * @param from From which Node do we start searching for the parent.
   * @param searchInInheritanceNodes If it is true, we will look for the parent in the inheritance nodes as well. Default is false.
   * @returns Parent Node if it exists, otherwise returns undefined.
   */
  findParent(
    node: Node,
    from?: Node,
    searchInInheritanceNodes?: boolean
  ): Node | undefined;

  /**
   * @param uri Path to the file. Uri needs to be decoded and without the "file://" prefix.
   * @param position Position in the file.
   * @param from From which Node do we start searching.
   * @returns Founded definition node.
   */
  findDefinitionNodeByPosition(
    uri: string,
    position: Position,
    from?: Node
  ): Node | undefined;

  findRenameNodeByPosition(
    uri: string,
    position: Position,
    from?: Node
  ): Node | undefined;

  /**
   * @param uri Path to the file. Uri needs to be decoded and without the "file://" prefix.
   * @param position Position in the file.
   * @param from From which Node do we start searching.
   * @param returnDefinitionNode If it is true, we will return the definition Node of found Node,
   * otherwise we will return found Node. Default is true.
   * @param searchInExpression If it is true, we will also look at the expressionNode for Node
   * otherwise, we won't. Default is false.
   * @returns Founded Node.
   */
  findNodeByPosition(
    uri: string,
    position: Position,
    from?: Node,
    searchInExpression?: boolean
  ): Node | undefined;

  /**
   * Searches children for definitionNode and if any exist adds them to the
   * children definitionNode list and sets their parent to definitionNode.
   *
   * @param definitionNode A node that calls this function and which will be the parent Node of the found children.
   * @param orphanNodes Place where we search for children.
   * @param isShadowed If this is true, make sure the child is in the shadow of definitionNode. Default is true.
   */
  findAndAddChildren(
    definitionNode: Node,
    orphanNodes: Node[],
    isShadowed?: boolean
  ): void;

  /**
   * Searches children for definitionNode and if any exist adds them to the
   * children definitionNode list and sets their parent to definitionNode.
   *
   * @param definitionNode A node that calls this function and which will be the parent Node of the found children.
   * @param orphanNodes Place where we search for children.
   */
  findAndAddChildrenShadowedByParent(
    definitionNode: Node,
    orphanNodes: Node[]
  ): void;

  /**
   * Searches export children for definitionNode and if any exist adds them to the
   * children definitionNode list and sets their parent to definitionNode.
   *
   * @param definitionNode A node that calls this function and which will be the parent Node of the found children.
   * @param exportNodes Place where we search for children.
   */
  findAndAddExportChildren(definitionNode: Node, exportNodes: Node[]): void;

  /**
   * It searches for parents in the definitonType children and if it finds it, it sets it as the parent for childNode.
   *
   * @param definiitonTypes Place where we search for parent.
   */
  findAndAddParentInDefinitionTypeVarialbles(
    childNode: Node,
    definiitonTypes: Node[],
    sourceUintNode?: Node
  ): void;

  /**
   * Searches for all definitionNodes in forwarded from Node and in its imports.
   *
   * @param uri File where is cursor now. Uri needs to be decoded and without the "file://" prefix.
   * @param position Cursor position in file.
   * @param from From which Node do we start searching.
   * @returns Definition Nodes.
   */
  findDefinitionNodes(uri: string, position: Position, from: Node): Node[];

  /**
   * Searches for all definitionNodes in inheritance Nodes and their inheritance Nodes.
   *
   * @param uri File where is cursor now. Uri needs to be decoded and without the "file://" prefix.
   * @param position Cursor position in file.
   * @param from From which Node do we start searching.
   * @returns Definition Nodes.
   */
  findInheritanceDefinitionNodes(
    uri: string,
    position: Position,
    from: Node | undefined,
    definitionNodes?: Node[],
    visitedNodes?: Node[],
    visitedFiles?: string[]
  ): Node[];

  /**
   * @param uri The path to the file. Uri needs to be decoded and without the "file://" prefix.
   * @param position Cursor position in file.
   * @param node That we will try to add in definitionNodes.
   * @param isShadowedByParent Is current from node shadowed by position.
   *
   * @returns If the node is visible, we will return true, otherwise it will be false.
   */
  checkIsNodeVisible(uri: string, position: Position, node: Node): boolean;

  /**
   * @returns Node visibility type.
   */
  getNodeVisibility(node: Node): string | undefined;
}

export enum SolFileState {
  UNLOADED = "UNLOADED",
  LOADED = "LOADED",
  ANALYZED = "ANALYZED",
  ERRORED = "ERRORED",
}

export enum ClientTrackingState {
  UNTRACKED = "UNTRACKED",
  TRACKED = "TRACKED",
}

export type SolProjectType = "hardhat" | "none";

export interface Remapping {
  from: string;
  to: string;
}

export interface ISolProject {
  type: SolProjectType;
  /**
   * The basepath of the solidity project.
   */
  basePath: string;
  configPath: string;
  workspaceFolder: WorkspaceFolder;
  remappings?: Remapping[];
}

export interface SolProjectMap {
  [key: string]: ISolProject;
}

export interface ISolFileEntry {
  /**
   * The path to the file with the document we are analyzing.
   * Uri needs to be decoded and without the "file://" prefix.
   */
  uri: string;

  /**
   * The contents of the file we will try to analyze.
   */
  text: string | undefined;

  project: ISolProject;

  /**
   * AST that we get from @solidity-parser/parser.
   */
  ast: ASTNode | undefined;

  /**
   * Analyzed tree.
   */
  analyzerTree: { tree: Node };

  /**
   * The status of the sol files analysis, you can only rely on the
   * ast and enhanced ast if the sol file is analyzed.
   */
  status: SolFileState;

  tracking: ClientTrackingState;

  searcher: Searcher;

  /**
   * The Nodes for which we couldn't find a parent.
   */
  orphanNodes: Node[];

  /**
   * Has an analysis pass succeeded, allowing a user to operate on the ast.
   */
  isAnalyzed(): boolean;

  /**
   * Set the Solidity file as being the responsibility of the client
   * but with no changes to the underlying file,
   */
  track(): void;

  /**
   * Set the Solidity file as no longer being the responsibility of the
   * client.
   */
  untrack(): void;
}

/**
 *  Position in file.
 */
export interface Position {
  line: number;
  column: number;
}

/**
 *  Location in file has start and end Position.
 */
export interface Location {
  start: Position;
  end: Position;
}

/**
 * @param {BaseASTNode} ast The ast node who you want to find.
 * @param {string} uri The path to the {@link Node} file.
 * Uri needs to be decoded and without the "file://" prefix.
 */
export type FinderType = (
  ast: BaseASTNode,
  uri: string,
  rootPath: string,
  documentsAnalyzer: SolFileIndexMap
) => Node;

/**
 * documentsAnalyzer Map { [uri: string]: DocumentAnalyzer } have all documentsAnalyzer class instances used for handle imports on first project start.
 */
export interface SolFileIndexMap {
  [uri: string]: ISolFileEntry;
}

export interface EmptyNodeType {
  type: "Empty";
  range?: [number, number];
  loc?: Location;
}

export abstract class Node {
  /**
   * AST node type.
   */
  public type: string;

  /**
   * The path to the {@link Node} file.
   * URI need to be decoded and without "file://" prefix.
   * To get that format of uri you can use decodeUriAndRemoveFilePrefix in @common/util
   */
  public uri: string;

  /**
   * The rootPath of the workspace where this Node belongs.
   */
  public rootPath: string;

  public readonly solFileIndex: SolFileIndexMap;

  /**
   * AST node interface.
   */
  public abstract astNode: BaseASTNode | EmptyNodeType;

  /**
   * Represents is node alive or not. If it isn't alive we need to remove it, because if we don't
   * remove the dead nodes, we can have references to code that doesn't exist. Default is true and
   * default implementations of the removeChildren will set isAlive to false.
   */
  public isAlive = true;

  /**
   * Exact name Location of Node used for rename and search node by name.
   */
  public nameLoc?: Location | undefined;

  /**
   * Node name. Name can be undefined for Nodes that don't have a name.
   */
  public name: string | undefined;

  /**
   * Import alias name. If the aliasName exists he is the real name and {@link Node.getName getName} will return the alias.
   */
  public aliasName?: string | undefined;

  /**
   * Serves to let us know if there is a Node expression like FunctionCallNode, ArrayTypeNameNode...
   *
   * It can be used to find the parents or children of a node because we know for example
   * whether the name functionDefinition and identifier are the same and that the identifier
   * is an expressionNode FunctionCall, we know that these 2 nodes are compressible.
   *
   * This will be needed for autocomplete because we need to know if some Node expression
   * might be a FunctionCallNode and then we know that Node needs brackets.
   */
  public expressionNode?: Node | undefined;
  /**
   * Serves to let us know who is declaration of some type Node this is the reverse of getTypeNodes.
   */
  public declarationNode?: Node | undefined;

  /**
   * Rules for declaration nodes that must be met in order for nodes to be connected.
   */
  public connectionTypeRules: string[] = [];

  /**
   * Node parent. Can be undefined for root or orphan Node.
   */
  public parent?: Node | undefined;
  /**
   * Node children.
   */
  public children: Node[] = [];

  /**
   * Node types.
   * Example: uint256 num; uint256 will be typeNode for VariableDeclarationNode num
   * TypeNodes is an array because some declaration can have more than one types like function.
   */
  public typeNodes: Node[] = [];

  /**
   * Base Node constructor
   * @param baseASTNode AST node interface.
   * @param uri The path to the node file. Uri needs to be decoded and without the "file://" prefix.
   */
  constructor(
    baseASTNode: BaseASTNode | EmptyNodeType,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap,
    name: string | undefined
  ) {
    this.type = baseASTNode.type;
    this.uri = uri;
    this.rootPath = rootPath;
    this.solFileIndex = documentsAnalyzer;
    this.name = name;
  }

  /**
   * Return Nodes that are the type definition of the Node
   */
  public getTypeNodes(): Node[] {
    let nodes: Node[] = [];

    this.typeNodes.forEach((typeNode) => {
      nodes = nodes.concat(typeNode.getTypeNodes());
    });

    return nodes;
  }

  /**
   * If node alerdy exists in the {@link Node.typeNodes typeNodes}, the old node will be removed, and new node will be added.
   * In that way we secure that we alwes have the latast node references in our {@link Node.typeNodes typeNodes}.
   */
  public addTypeNode(node: Node): void {
    const typeNodeExist: Node | undefined = this.typeNodes.filter((typeNode) =>
      isNodeEqual(typeNode, node)
    )[0];

    if (typeNodeExist !== undefined) {
      const index = this.typeNodes.indexOf(typeNodeExist);
      this.typeNodes.splice(index, 1);
    }

    this.typeNodes.push(node);
  }

  /**
   * An {@link Node.expressionNode expressionNode} is a Node above the current Node by AST.
   * @returns ExpressionNode if exist otherwise undefined
   */
  public getExpressionNode(): Node | undefined {
    return this.expressionNode;
  }

  public setExpressionNode(node: Node | undefined): void {
    this.expressionNode = node;
  }

  /**
   * Return Node that are the definition of the Node if definition exists.
   */
  public getDefinitionNode(): Node | undefined {
    return this.parent?.getDefinitionNode();
  }

  public getDeclarationNode(): Node | undefined {
    return this.declarationNode;
  }

  public setDeclarationNode(node: Node | undefined): void {
    this.declarationNode = node;
  }

  /**
   * A Node name can be undefined for Nodes that don't have a name.
   */
  public getName(): string | undefined {
    return this.name;
  }

  public setName(name: string): void {
    this.name = name;
  }

  /**
   * A Node alias name can be undefined for Nodes that don't declared with alias name.
   * If the aliasName exists he is the real name and {@link Node.getName getName} will return the alias.
   */
  public getAliasName(): string | undefined {
    return this.aliasName;
  }

  public setAliasName(aliasName: string | undefined): void {
    this.aliasName = aliasName;
  }

  /**
   * If a child already exists in the {@link Node.children children}, it will not be added.
   */
  public addChild(child: Node): void {
    const childExist: Node | undefined = this.children.filter((tmpChild) =>
      isNodeEqual(tmpChild, child)
    )[0];

    if (childExist === undefined) {
      this.children.push(child);
    }
  }

  /**
   * Note that removeChild will set {@link Node.isAlive isAlive} to false for the removed child
   * @param child Child who you want to remove
   */
  public removeChild(child: Node): void {
    const index = this.children.indexOf(child, 0);

    if (index > -1) {
      this.children.splice(index, 1);
    }

    child.isAlive = false;
  }

  public setParent(parent: Node | undefined): void {
    this.parent = parent;
  }

  public getParent(): Node | undefined {
    return this.parent;
  }

  /**
   *
   * @param find A Matcher find function that matches BaseASTNode to analyzer Nodes then create metched analyzer Node and returned it.
   * @param orphanNodes Array of nodes that didn't find a parent.
   * @param parent {@link Node.parent Parent} of current node in AST (Abstract syntax tree).
   * @param expression AST child Node {@link Node.expressionNode expression}. Expression serves to let us know later if there is a Node expression like FunctionCallNode, ArrayTypeNameNode...
   *
   * @returns Child node in AST.
   */
  public abstract accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Node;
}

export class EmptyNode extends Node {
  public astNode: EmptyNodeType;

  constructor(
    emptyNode: EmptyNodeType,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(emptyNode, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = emptyNode;
  }

  public accept(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    find: FinderType,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    orphanNodes: Node[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    parent?: Node,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    expression?: Node
  ): Node {
    return this;
  }
}

export abstract class ContractDefinitionNode extends Node {
  /**
   * AST ContractDefinition interface.
   */
  public abstract astNode: ContractDefinition;

  public inheritanceNodes: ContractDefinitionNode[] = [];

  /**
   * Kind can be "abstract" | "contract" | "library" | "interface".
   * @returns Contract kind.
   */
  public abstract getKind(): string;

  /**
   * @returns inherited Nodes
   */
  public getInheritanceNodes(): ContractDefinitionNode[] {
    return this.inheritanceNodes;
  }
}

export abstract class MemberAccessNode extends Node {
  /**
   * AST MemberAccess interface.
   */
  public abstract astNode: MemberAccess;

  public previousMemberAccessNode: Node | undefined;

  public setPreviousMemberAccessNode(node: Node): void {
    this.previousMemberAccessNode = node;
  }

  /**
   * @returns get previous MemberAccessNode
   */
  public getPreviousMemberAccessNode(): Node | undefined {
    return this.previousMemberAccessNode;
  }
}

export abstract class ImportDirectiveNode extends Node {
  /**
   * AST ImportDirective interface.
   */
  public abstract astNode: ImportDirective;

  /**
   * The path to the file.
   * But in this case, realUri will be the URI of the file in which the import is declared.
   * And {@link Node.uri uri} will be a path to imported Node.
   */
  public abstract realUri: string;

  public aliasNodes: Node[] = [];

  public getImportPath(): string | undefined {
    return this.uri;
  }

  public addAliasNode(aliasNode: Node): void {
    this.aliasNodes.push(aliasNode);
  }

  public getAliasNodes(): Node[] {
    return this.aliasNodes;
  }
}

export abstract class SourceUnitNode extends Node {
  /**
   * AST SourceUnit interface.
   */
  public abstract astNode: SourceUnit;

  public importNodes: Node[] = [];
  public exportNodes: Node[] = [];

  public addImportNode(importNode: Node): void {
    this.importNodes.push(importNode);
  }

  /**
   * @returns all imported Nodes in this SourceUint.
   */
  public getImportNodes(): Node[] {
    return this.importNodes;
  }

  public addExportNode(exportNode: Node): void {
    this.exportNodes.push(exportNode);
  }

  /**
   * @returns all exported Nodes from this SourceUint.
   */
  public getExportNodes(): Node[] {
    return this.exportNodes;
  }
}

export abstract class FunctionDefinitionNode extends Node {
  /**
   * AST FunctionDefinition interface.
   */
  public abstract astNode: FunctionDefinition;

  public isConstructor = false;

  /**
   * Visibility can be 'default' | 'external' | 'internal' | 'public' | 'private'
   *
   * @returns function visibility.
   */
  public getVisibility(): string {
    return this.astNode.visibility;
  }
}

export abstract class VariableDeclarationNode extends Node {
  /**
   * AST VariableDeclaration interface.
   */
  public abstract astNode: VariableDeclaration;

  /**
   * Visibility can be 'public' | 'private' | 'internal' | 'default'
   *
   * @returns function visibility.
   */
  public getVisibility(): string | undefined {
    return this.astNode.visibility;
  }
}

export abstract class IdentifierNode extends Node {
  /**
   * AST Identifier interface.
   */
  public abstract astNode: Identifier;

  public identifierFields: Node[] = [];

  public getIdentifierFields(): Node[] {
    return this.identifierFields;
  }

  /**
   * This is the place for all nonhandled identifier fileds like FunctionCallNode identifiers,
   * that we want to handle after when this node gets a parent.
   */
  public addIdentifierField(identifierField: Node): void {
    this.identifierFields.push(identifierField);
  }
}

export const definitionNodeTypes = [
  "ContractDefinition",
  "StructDefinition",
  "ModifierDefinition",
  "FunctionDefinition",
  "EventDefinition",
  "EnumDefinition",
  "CustomErrorDefinition",
  "AssemblyLocalDefinition",
  "LabelDefinition",
  "AssemblyFunctionDefinition",
  "UserDefinedTypeName",
  "FileLevelConstant",
  "TypeDefinition",
];
export const declarationNodeTypes = [
  "StateVariableDeclaration",
  "UsingForDeclaration",
  "VariableDeclaration",
  "VariableDeclarationStatement",
];
export const expressionNodeTypes = [
  "IndexAccess",
  "IndexRangeAccess",
  "TupleExpression",
  "BinaryOperation",
  "Conditional",
  "MemberAccess",
  "FunctionCall",
  "UnaryOperation",
  "NewExpression",
  "NameValueExpression",
  "BooleanLiteral",
  "HexLiteral",
  "StringLiteral",
  "NumberLiteral",
  "Identifier",
  "TupleExpression",
  "TypeNameExpression",
];

/**
 * Checks if 2 nodes have the same {@link Node.getName name}, {@link Node.nameLoc location name} and {@link Node.uri URI}.
 * @returns true if the Nodes are equal, otherwise false.
 */
function isNodeEqual(
  node1: Node | undefined,
  node2: Node | undefined
): boolean {
  if (!node1 || !node2) {
    return false;
  }

  if (node1 === node2) {
    return true;
  }

  if (
    node1.getName() === node2.getName() &&
    JSON.stringify(node1.nameLoc) === JSON.stringify(node2.nameLoc) &&
    node1.uri === node2.uri
  ) {
    return true;
  }

  return false;
}

export type AstMutability = "pure" | "constant" | "payable" | "view" | null;
export type AstVisibility =
  | "default"
  | "external"
  | "internal"
  | "public"
  | "private";

export const mutabliltyPrecedence: AstMutability[] = [
  null,
  "payable",
  "view",
  "constant",
  "pure",
];

export const visibilityPrecedence: AstVisibility[] = [
  "default",
  "private",
  "internal",
  "external",
  "public",
];

export type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U;
