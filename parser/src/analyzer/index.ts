import * as parser from "@solidity-parser/parser";
import { AST } from "@solidity-parser/parser/dist/ast-types";

import { getCircularReplacer } from "../utils";
import { Node } from "./nodes/Node"
import * as finder from "./finder";
import * as matcher from "./matcher";

export class Analyzer {
    document: string | undefined;
    uri: string | undefined;

    ast: AST | undefined;

    analyzerTree?: Node;

    orphanNodes: Node[] = [];

    constructor(document: string, uri: string) {
        try {
            this.document = document;
            this.uri = uri;

            this.ast = parser.parse(document, {
                loc: true,
                range: true,
                tolerant: true
            });

            // TO-DO: Make accept func to return Node
            matcher.find(this.ast, this.uri).accept(matcher.find, this.orphanNodes);
            this.analyzerTree = finder.analyzerTree;

            // TO-DO: Find parent for orphanNodes

            console.log(JSON.stringify(this.analyzerTree, getCircularReplacer()));
        } catch (err) {
            console.error(err);
        }
    }
};
