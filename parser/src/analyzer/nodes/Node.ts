import { AST } from "@solidity-parser/parser/dist/ast-types";

export interface Position {
    line: number;
    column: number;
}

export interface Location {
    start: Position;
    end: Position;
}

export type FinderType = (ast: AST, uri: string) => Node;

export interface Component {
    accept(find: FinderType, orphanNodes: Node[], parent?: Node): Node;
}

export interface Node extends Component {
    type: string;
    uri: string;
    astNode: AST;
    
    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[];

    addChild(child: Node): void;
    setParent(parent: Node): void;
    getName(): string | undefined;
}
