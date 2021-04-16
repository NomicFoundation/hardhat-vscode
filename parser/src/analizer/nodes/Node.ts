import { AST } from "@solidity-parser/parser/dist/ast-types";

export interface Position {
    line: number;
    column: number;
}

export interface Location {
    start: Position;
    end: Position;
}

export interface Component {
    accept(orphanNodes: Node[], parent?: Node): void;
}

export interface Node extends Component {
    uri: string;

    type: string;
    nameLoc?: Location;

    parent?: Node;
    children: Node[];

    astNode: AST

    addChild(child: Node): void;
    setParent(parent: Node): void;
}
