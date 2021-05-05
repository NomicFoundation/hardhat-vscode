import * as parser from "@solidity-parser/parser";
import { ASTNode } from "@solidity-parser/parser/dist/src/ast-types";

import { getCircularReplacer } from "../utils";
import { Node } from "./nodes/Node";
import * as finder from "./finder";
import * as matcher from "./matcher";

export class Analyzer {
    document: string | undefined;
    uri: string | undefined;

    ast: ASTNode | undefined;

    analyzerTree?: Node;

    orphanNodes: Node[] = [];

    public analyzeDocument(document: string, uri: string): Node | undefined {
        try {
            this.document = document;
            this.uri = uri;

            this.ast = parser.parse(document, {
                loc: true,
                range: true,
                tolerant: true
            });

            console.log(JSON.stringify(this.ast));

            this.analyzerTree = matcher.find(this.ast, this.uri).accept(matcher.find, this.orphanNodes);

            this.findParentForOrphanNodes();

            // console.log(JSON.stringify(this.analyzerTree, getCircularReplacer()));

            return this.analyzerTree;
        } catch (err) {
            console.error(err);
        }
    }

    private findParentForOrphanNodes() {
        const orphanNodes: Node[] = [];

        let orphanNode = this.orphanNodes.shift();
        while (orphanNode) {
            const identifierParent = finder.findParent(orphanNode, this.analyzerTree);

            if (identifierParent) {
                orphanNode.setParent(identifierParent);
                identifierParent?.addChild(orphanNode);
    
                orphanNode.typeNodes.push(identifierParent);
            } else {
                orphanNodes.push(orphanNode);
            }

            orphanNode = this.orphanNodes.shift();
        }

        this.orphanNodes = orphanNodes;
    }
}
