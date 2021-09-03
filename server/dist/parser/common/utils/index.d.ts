import { Position, Location, Node, SourceUnitNode, Range, VSCodePosition } from "@common/types";
export declare function findNodeModules(fromURI: string, rootPath: string): string | undefined;
export declare function getParserPositionFromVSCodePosition(position: VSCodePosition): Position;
export declare function getRange(loc: Location): Range;
/**
 * Checks if the forwarded position is equal to the position of the forwarded Node.
 *
 * @returns true if the positions are equal, otherwise false.
 */
export declare function isNodePosition(node: Node, position: Position): boolean;
/**
 * Checks if the child's range is within the parent range.
 *
 * @returns true if the child is shadowed by a parent, otherwise false.
 */
export declare function isNodeShadowedByNode(child: Node | undefined, parent: Node | undefined): boolean;
/**
 * Checks if the position is within the node position.
 *
 * @returns true if the position is shadowed by node, otherwise false.
 */
export declare function isPositionShadowedByNode(position: Position, node: Node | undefined): boolean;
/**
 * Checks if the child can connect with the parent.
 *
 * @returns true if the child is connectable to parent, otherwise false.
 */
export declare function isNodeConnectable(parent: Node | undefined, child: Node | undefined): boolean;
/**
 * @param node From which Node do we start searching.
 * @returns SourceUnitNode if exist.
 */
export declare function findSourceUnitNode(node: Node | undefined): SourceUnitNode | undefined;
/**
 * Checks that the forwarded URI is the same as the ContractDefinitionNode URI and
 * that the forwarded position shadowed by the forwarded ContractDefinitionNode location.
 *
 * @param uri The path to the file of position. Uri needs to be decoded and without the "file://" prefix.
 * @param position Cursor position in file.
 * @param node From which node we will try go to ContractDefinitionNode.
 * @returns true if position in node contractDefinition, otherwise false.
 */
export declare function checkIfPositionInNodeContractDefinition(uri: string, position: Position, node: Node | undefined): boolean;
