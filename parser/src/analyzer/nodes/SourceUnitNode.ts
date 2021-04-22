import { SourceUnit } from "@solidity-parser/parser/dist/ast-types";

import * as finder from "../finder";
import { Location, FinderType, Node } from "./Node";

export class SourceUnitNode implements Node {
    type: string;
    uri: string;
    astNode: SourceUnit;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    constructor (sourceUnit: SourceUnit, uri: string) {
        this.type = sourceUnit.type;
        this.uri = uri;
        this.astNode = sourceUnit;
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

    accept(find: FinderType, orphanNodes: Node[], parent?: Node): Node {
        finder.setRoot(this);

        for (const child of this.astNode.children) {
            find(child, this.uri).accept(find, orphanNodes, this);
        }

        return this;
    }
}
