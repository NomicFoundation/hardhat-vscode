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
    accept(find: FinderType, orphanNodes: Node[], parent?: Node): Node;
}

export interface Node extends Component {
    type: string;
    uri: string;
    astNode: BaseASTNode;
    
    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[];

    typeNodes: Node[];
    
    addChild(child: Node): void;
    setParent(parent: Node): void;
    getName(): string | undefined;
    getTypeNodes(): Node[];
}
