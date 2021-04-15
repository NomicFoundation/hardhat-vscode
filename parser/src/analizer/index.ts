import * as parser from "@solidity-parser/parser";
import { AST } from "@solidity-parser/parser/dist/ast-types";

import { Node } from "./nodes/Node"
import { getCircularReplacer } from "../utils";
import * as matcher from "./matcher";

export class Analyzer {
    uri: string;
    document: string;

    ast: AST;

    analyzerTree?: Node;

    orphanNodes: Node[] = [];

    constructor(uri: string, document: string) {
        this.uri = uri;
        this.document = document;

        this.ast = parser.parse(document, {
            loc: true,
            range: true,
            tolerant: true
        });

        matcher.find(this.ast, this.uri).accept(this.orphanNodes, this.analyzerTree);

        console.log(JSON.stringify(this.analyzerTree, getCircularReplacer()));
    }
};
