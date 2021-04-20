import { LabelDefinition } from "@solidity-parser/parser/dist/ast-types";

import { Location, FinderType, Node } from "./Node";

export class LabelDefinitionNode implements Node {
    type: string;
    uri: string;
    astNode: LabelDefinition;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    constructor (labelDefinition: LabelDefinition, uri: string) {
        this.type = labelDefinition.type;
        this.uri = uri;
        this.astNode = labelDefinition;
        // TO-DO: Implement name location for rename
    }

    getName(): string | undefined {
        return undefined;
    }

    addChild(child: Node): void {
        this.children.push(child);
    }

    setParent(parent: Node): void {
        this.parent = parent;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node): void {
        // TO-DO: Method not implemented
    }
}
