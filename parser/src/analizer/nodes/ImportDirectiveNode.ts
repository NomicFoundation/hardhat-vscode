import { AST, ImportDirective } from "@solidity-parser/parser/dist/ast-types";

import { FinderType } from "../matcher";
import { Node } from "./Node";

export class ImportDirectiveNode extends Node<ImportDirective> {
    constructor(importDirective: ImportDirective, uri: string) {
        // TO-DO: Implement name location for rename (maybe have it as part of the abstract class)
        super(importDirective, uri);
    }

    accept<K extends AST>(find: FinderType, orphanNodes: Node<K>[], parent?: Node<K>): void {
        // TO-DO: Implement accept
    }
}
