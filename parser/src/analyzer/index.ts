import * as parser from "@solidity-parser/parser";
import { AST } from "@solidity-parser/parser/dist/ast-types";

import { getCircularReplacer } from "../utils";
import { Node } from "./nodes/Node"
import * as matcher from "./matcher";

export class Analyzer {
    document: string;
    uri: string;

    ast: AST;

    analyzerTree?: Node;

    orphanNodes: Node[] = [];

    constructor(document: string, uri: string) {
        this.document = document;
        this.uri = uri;

        this.ast = parser.parse(document, {
            loc: true,
            range: true,
            tolerant: true
        });

        matcher.find(this.ast, this.uri).accept(matcher.find, this.orphanNodes, this.analyzerTree);

        console.log(JSON.stringify(this.analyzerTree, getCircularReplacer()));
    }
};
