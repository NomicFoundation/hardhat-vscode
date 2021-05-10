import { BaseASTNode } from "@solidity-parser/parser/dist/src/ast-types";

export interface Position {
    line: number;
    column: number;
}

export interface Location {
    start: Position;
    end: Position;
}

export type FinderType = (ast: BaseASTNode, uri: string) => Node;

export interface Component {
    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node;
}

export interface Node extends Component {
    type: string;
    uri: string;
    astNode: BaseASTNode;

    nameLoc?: Location | undefined;

    expressionType?: Node | undefined;

    connectionTypeRules: string[];

    parent?: Node | undefined;
    children: Node[];

    typeNodes: Node[];

    getTypeNodes(): Node[];
    addTypeNode(node: Node): void;

    getExpressionNode(): Node | undefined;
    setExpressionNode(node: Node | undefined): void;

    getName(): string | undefined;

    addChild(child: Node): void;
    setParent(parent: Node | undefined): void;
    getParent(): Node | undefined;

    getDefinitionNode(): Node | undefined;
}
