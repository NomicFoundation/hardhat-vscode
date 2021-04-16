import { AST, BaseASTNode } from "@solidity-parser/parser/dist/ast-types";
import { FinderType } from "../matcher";

export interface Position {
    line: number;
    column: number;
}

export interface Location {
    start: Position;
    end: Position;
}

export interface Component {
    accept<T extends AST>(find: FinderType, orphanNodes: Node<T>[], parent?: Node<T>): void;
}

export abstract class Node<T extends AST> implements Component {
    type: string;

    uri: string;
    
    nameLoc?: Location | undefined;

    astNode: T;

    parent?: Node<T> | undefined;
    children: Node<T>[] =[];

    constructor(astNode: T, uri: string) {
        this.astNode = astNode;
        this.type = astNode.type;
        this.uri = uri;
    }

    abstract accept<K extends AST>(find: FinderType, orphanNodes: Node<K>[], parent?: Node<K>): void;

    addChild(child: Node<T>): void {
        this.children.push(child);
    }
    setParent(parent: Node<T>): void {
        this.parent = parent;
    }

}
