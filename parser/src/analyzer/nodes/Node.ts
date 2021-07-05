import { ASTNode, BaseASTNode } from "@solidity-parser/parser/dist/src/ast-types";

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
 */
export type FinderType = (
    ast: BaseASTNode,
    uri: string,
    rootPath: string,
    documentsAnalyzer: DocumentsAnalyzerMap
) => Node;

export interface DocumentAnalyzer {
    /**
     * The rootPath of the workspace.
     */
    rootPath: string;

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
     * If the document is analyzed this will be true, otherwise false.
     */
    isAnalyzed: boolean;

    /**
     * The Nodes for which we couldn't find a parent.
     */
    orphanNodes: Node[];

    analyze(documentsAnalyzer: DocumentsAnalyzerMap, document?: string): Node | undefined;
}

/**
 * documentsAnalyzer Map { [uri: string]: DocumentAnalyzer } have all documentsAnalyzer class instances used for handle imports on first project start.
 */
export type DocumentsAnalyzerMap = { [uri: string]: DocumentAnalyzer | undefined };

export abstract class Node {
    /**
     * AST node type.
     */
    type: string;

    /**
     * The path to the {@link Node} file.
     * URI need to be decoded and without "file://" prefix.
     * To get that format of uri you can use decodeUriAndRemoveFilePrefix in @common/util
     */
    uri: string;

    /**
     * The rootPath of the workspace where this Node belongs.
     */
    rootPath: string;

    readonly documentsAnalyzer: DocumentsAnalyzerMap;

    /**
     * AST node interface.
     */
    abstract astNode: BaseASTNode;

    /**
     * Represents is node alive or not. If it isn't alive we need to remove it, because if we don't 
     * remove the dead nodes, we can have references to code that doesn't exist. Default is true and
     * default implementations of the removeChildren will set isAlive to false.
     */
    isAlive = true;

    /**
     * Exact name Location of Node used for rename and search node by name.
     */
    nameLoc?: Location | undefined;

    /**
     * Import alias name. If the aliasName exists he is the real name and {@link Node.getName getName} will return the alias.
     */
    aliasName?: string | undefined;

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
    connectionTypeRules: string[] = [];

    /**
     * Node parent. Can be undefined for root or orphan Node.
     */
    parent?: Node | undefined;
    /**
     * Node children.
     */
    children: Node[] = [];

    /**
     * Node types.
     * Example: uint256 num; uint256 will be typeNode for VariableDeclarationNode num
     * TypeNodes is an array because some declaration can have more than one types like function. 
     */
    typeNodes: Node[] = [];

    /**
     * Base Node constructor
     * @param baseASTNode AST node interface.
     * @param uri The path to the node file.
     */
    constructor (baseASTNode: BaseASTNode, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) {
        this.type = baseASTNode.type;
        this.uri = uri;
        this.rootPath = rootPath;
        this.documentsAnalyzer = documentsAnalyzer;
    }

    /**
     * Return Nodes that are the type definition of the Node
     */
    getTypeNodes(): Node[] {
        let nodes: Node[] = [];

        this.typeNodes.forEach(typeNode => {
            nodes = nodes.concat(typeNode.getTypeNodes());
        });

        return nodes;
    }

    /**
     * If node alerdy exists in the {@link Node.typeNodes typeNodes}, the old node will be removed, and new node will be added.
     * In that way we secure that we alwes have the latast node references in our {@link Node.typeNodes typeNodes}.
     */
    addTypeNode(node: Node): void {
        const typeNodeExist = this.typeNodes.filter(typeNode => isNodeEqual(typeNode, node))[0];

        if (typeNodeExist) {
            const index = this.typeNodes.indexOf(typeNodeExist);
            this.typeNodes.splice(index, 1);
        }

        this.typeNodes.push(node);
    }

    /**
     * An {@link Node.expressionNode expressionNode} is a Node above the current Node by AST.
     * @returns ExpressionNode if exist otherwise undefined
     */
    getExpressionNode(): Node | undefined {
        return this.expressionNode;
    }

    setExpressionNode(node: Node | undefined): void {
        this.expressionNode = node;
    }

    /**
     * Return Node that are the definition of the Node if definition exists.
     */
    getDefinitionNode(): Node | undefined {
        return this.parent?.getDefinitionNode();
    }

    getDeclarationNode(): Node | undefined {
        return this.declarationNode;
    }

    setDeclarationNode(node: Node | undefined): void {
        this.declarationNode = node;
    }

    /**
     * A Node name can be undefined for Nodes that don't have a name.
     */
    getName(): string | undefined {
        return undefined;
    }

    /**
     * A Node alias name can be undefined for Nodes that don't declared with alias name.
     * If the aliasName exists he is the real name and {@link Node.getName getName} will return the alias.
     */
    getAliasName(): string | undefined {
        return this.aliasName;
    }

    setAliasName(aliasName: string | undefined): void {
        this.aliasName = aliasName;
    }

    /**
     * If a child already exists in the {@link Node.children children}, it will not be added.
     */
    addChild(child: Node): void {
        const childExist = this.children.filter(tmpChild => isNodeEqual(tmpChild, child))[0];

        if (!childExist) {
            this.children.push(child);
        }
    }

    /**
     * Note that removeChild will set {@link Node.isAlive isAlive} to false for the removed child
     * @param child Child who you want to remove
     */
    removeChild(child: Node): void {
        const index = this.children.indexOf(child, 0);

        if (index > -1) {
            this.children.splice(index, 1);
        }

        child.isAlive = false;
    }

    setParent(parent: Node | undefined): void {
        this.parent = parent;
    }

    getParent(): Node | undefined {
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
    abstract accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}

/**
 * Checks if 2 nodes have the same {@link Node.getName name}, {@link Node.nameLoc location name} and {@link Node.uri URI}. 
 * @returns true if the Nodes are equal, otherwise false.
 */
function isNodeEqual(node1: Node | undefined, node2: Node | undefined): boolean {
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