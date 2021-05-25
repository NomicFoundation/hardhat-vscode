import { BaseASTNode } from "@solidity-parser/parser/dist/src/ast-types";

/** 
 *  Position in vscode file.
 */
export interface Position {
    line: number;
    column: number;
}

/** 
 *  Location in vscode file has start and end Position.
 */
export interface Location {
    start: Position;
    end: Position;
}

/**
 * @param {BaseASTNode} ast The node who you want to find.
 * @param {string} uri The path to the file of that ast node.
 */
export type FinderType = (ast: BaseASTNode, uri: string) => Node;

export interface Component {
    /**
     * 
     * @param find A Matcher find function that matches BaseASTNode to analyzer Nodes then create metched analyzer Node and returned it.
     * @param orphanNodes Array of nodes that didn't find a parent.
     * @param parent Parent of current node in AST (Abstract syntax tree).
     * @param expression AST child Node expression. Expression serves to let us know later if there is a Node expression like FunctionCallNode, ArrayTypeNameNode...  
     * 
     * @returns Child node.
     */
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}

export interface Node extends Component {
    /**
     * AST node type.
     */
    type: string;
    /**
     * The path to the file of that ast node.
     */
    uri: string;
    /**
     * AST node interface.
     */
    astNode: BaseASTNode;

    /**
     * Exect name Location of that Node used for rename and search node by name.
     */
    nameLoc?: Location | undefined;

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
    expressionNode?: Node | undefined;
    /**
     * Serves to let us know who is declaration of some type Node this is the reverse of getTypeNodes.
     */
    declarationNode?: Node | undefined;

    /**
     * Rules for declaration nodes that must be met in order for nodes to be connected.
     */
    connectionTypeRules: string[];

    /**
     * Node parent. Can be undefined for root or orphan Node.
     */
    parent?: Node | undefined;
    /**
     * Node children.
     */
    children: Node[];

    /**
     * Node types.
     */
    typeNodes: Node[];

    /**
     * Return Nodes that are the type definition of the Node
     */
    getTypeNodes(): Node[];
    addTypeNode(node: Node): void;

    getExpressionNode(): Node | undefined;
    setExpressionNode(node: Node | undefined): void;

    getDeclarationNode(): Node | undefined;
    setDeclarationNode(node: Node | undefined): void;

    /**
     * A Node name can be undefined for Nodes that don't have a name.
     */
    getName(): string | undefined;

    addChild(child: Node): void;
    setParent(parent: Node | undefined): void;
    getParent(): Node | undefined;

    /**
     * Return Node that are the definition of the Node if definition exists.
     */
    getDefinitionNode(): Node | undefined;
}

export interface ContractDefinitionNode extends Node {
    inheritanceNodes: ContractDefinitionNode[];

    getKind(): string;
    getInheritanceNodes(): ContractDefinitionNode[];
}

export const shadowNodes = [ "FunctionDefinition", "ContractDefinition", "StructDefinition", "AssemblyBlock", "ForStatement", "WhileStatementNode", "DoWhileStatementNode", "IfStatementNode" ];
export const definitionNodeTypes = [ "ContractDefinition", "StructDefinition", "ModifierDefinition", "FunctionDefinition", "EventDefinition", "EnumDefinition", "AssemblyLocalDefinition", "LabelDefinition", "AssemblyFunctionDefinition", "UserDefinedTypeName" ];
