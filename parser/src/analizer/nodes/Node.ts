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
    accept(find: (ast: AST, uri: string) => Node, orphanNodes: Node[], parent?: Node): void;
}

export interface Node extends Component {
    type: string;

    uri: string;
    
    name?: string | undefined;
    nameLoc?: Location | undefined;
    loc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[];

    addChild(child: Node): void;
    setParent(parent: Node): void;
}
