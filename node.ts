export interface Position {
    line: number;
    column: number;
}

export interface Location {
    start: Position;
    end: Position;
}

export class Node {
    uri: string;

    loc: Location;

    type: string;
    name: string;

    parent: Node = null;
    children: Node[] = [];

    constructor(uri: string, loc: Location, type: string, name: string, parent: Node) {
        this.uri = uri;

        this.loc = loc;

        this.type = type;
        this.name = name;

        this.parent = parent ? parent : null;
    }

    addChild = (child: Node) => {
        this.children.push(child);
    }

    setParent = (parent: Node) => {
        this.parent = parent;
    }
}
