import { Position, Node, Searcher as ISearcher } from "@common/types";
export declare class Searcher implements ISearcher {
    /**
     * Default analyzerTree. It is document we are analyzing.
     */
    analyzerTree: {
        tree: Node;
    };
    constructor(analyzerTree: {
        tree: Node;
    });
    /**
     * Searches for a parent definition for the forwarded Node.
     *
     * @param node Node for wich we are looking for a parent.
     * @param from From which Node do we start searching for the parent.
     * @param searchInInheritanceNodes If it is true, we will look for the parent in the inheritance nodes as well. Default is false.
     * @returns Parent Node if it exists, otherwise returns undefined.
     */
    findParent(node: Node, from?: Node, searchInInheritanceNodes?: boolean): Node | undefined;
    /**
     * @param uri Path to the file. Uri needs to be decoded and without the "file://" prefix.
     * @param position Position in the file.
     * @param from From which Node do we start searching.
     * @returns Founded definition node.
     */
    findDefinitionNodeByPosition(uri: string, position: Position, from?: Node): Node | undefined;
    /**
     * @param uri Path to the file. Uri needs to be decoded and without the "file://" prefix.
     * @param position Position in the file.
     * @param from From which Node do we start searching.
     * @param searchInExpression If it is true, we will also look at the expressionNode for Node
     * otherwise, we won't. Default is false.
     * @returns Founded definition node.
     */
    findNodeByPosition(uri: string, position: Position, from?: Node, searchInExpression?: boolean): Node | undefined;
    /**
     * Searches children for definitionNode and if any exist adds them to the
     * children definitionNode list and sets their parent to definitionNode.
     *
     * @param definitionNode A node that calls this function and which will be the parent Node of the found children.
     * @param orphanNodes Place where we search for children.
     * @param isShadowed If this is true, make sure the child is in the shadow of definitionNode. Default is true.
     */
    findAndAddChildren(definitionNode: Node, orphanNodes: Node[], isShadowed?: boolean): void;
    /**
     * Searches children for definitionNode and if any exist adds them to the
     * children definitionNode list and sets their parent to definitionNode.
     *
     * @param definitionNode A node that calls this function and which will be the parent Node of the found children.
     * @param exportNodes Place where we search for children.
     */
    findAndAddExportChildren(definitionNode: Node, exportNodes: Node[]): void;
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
    private _findNodeByPosition;
    /**
     * This function looking for a Node that can be connected to the forwarded node.
     *
     * @param node For which we are trying to find a node that can be connected.
     * @param from From which Node do we start searching.
     * @param searchInInheritanceNodes If it is true, we will look for the parent in the inheritance nodes as well.
     * @returns Node that can connect to the forwarded node.
     */
    private search;
    /**
     * This function looking in imported files for a Node that can be connected to the forwarded node.
     * This means that we will not check if the Node is shaded because it is in another file.
     *
     * @param visitedFiles This will be an array of URIs.
     * We need this to stop infinite recursion if someone implements circular dependency.
     * @param node For which we are trying to find a node that can be connected.
     * @param from From which Node do we start searching.
     * @returns Node that can connect to the forwarded node.
     */
    private searchInImportNodes;
    /**
     * We search Node in expression, we have to search in an expression node,
     * because expression nodes, such as MemberAccess, aren't in orphanNodes.
     *
     * @param uri The path to the {@link Node} file. Uri needs to be decoded and without the "file://" prefix.
     * @param position {@link Node} position in file.
     * @returns Wanted {@link Node} if exist.
     */
    private searchInExpressionNode;
    /**
     * Walk through the analyzedTree and try to find Node with forwarded {@link Node.uri uri} and {@link Node.nameLoc position}.
     *
     * @param uri The path to the {@link Node} file. Uri needs to be decoded and without the "file://" prefix.
     * @param position {@link Node} position in file.
     * @param from From which Node do we start searching.
     * @param searchInExpression Default is false. Set true only if you try to find Nodes
     * that aren't in orphan Nodes and don't have a parent. Like MemberAccessNode without a parent.
     * @returns Wanted {@link Node} if exist.
     */
    private walk;
    /**
     *
     * @param uri The path to the {@link Node} file. Uri needs to be decoded and without the "file://" prefix.
     * @param position Cursor position in file.
     * @param from From which Node do we start searching.
     * @param definitionNodes When the function is complete, we will find all the definition nodes here.
     * @param isShadowedByParent Is current from node shadowed by position.
     */
    private _findDefinitionNodes;
}
