import {
    AST,
} from "@solidity-parser/parser/dist/ast-types";

import * as parser from "@solidity-parser/parser";

import {
    Node
} from "./node"

import { getCircularReplacer } from "../utils";

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

        console.log(JSON.stringify(this.analyzerTree, getCircularReplacer()));
    }
};
