import "module-alias/register";

import * as fs from "fs";
import * as path from "path";
import * as parser from "@solidity-parser/parser";
import { ASTNode } from "@solidity-parser/parser/dist/src/ast-types";

import * as matcher from "@analyzer/matcher";
import { decodeUriAndRemoveFilePrefix } from "@common/utils";
import {
    Node, SourceUnitNode, DocumentsAnalyzerMap,
    DocumentAnalyzer as IDocumentAnalyzer
} from "@common/types";

export class Analyzer {
    rootPath: string;

    documentsAnalyzer: DocumentsAnalyzerMap = {};

    constructor (rootPath: string) {
        this.rootPath = decodeUriAndRemoveFilePrefix(rootPath);

        const documentsUri: string[] = [];
        this.findSolFiles(this.rootPath, documentsUri);

        // Init all documentAnalyzers
        for (const documentUri of documentsUri) {
            this.documentsAnalyzer[documentUri] = new DocumentAnalyzer(this.rootPath, documentUri);
        }

        // TO-DO: More comments and move cache to Analyzer
        for (const documentUri of documentsUri) {
            const documentAnalyzer = this.getDocumentAnalyzer(documentUri);

            if (!documentAnalyzer.isAnalyzed) {
                documentAnalyzer.analyze(this.documentsAnalyzer);
            }
        }
    }

    /**
     * Get or create and get DocumentAnalyzer.
     */
    public getDocumentAnalyzer(uri: string): DocumentAnalyzer {
        uri = decodeUriAndRemoveFilePrefix(uri);

        let documentAnalyzer = this.documentsAnalyzer[uri];
        if (!documentAnalyzer) {
            documentAnalyzer = new DocumentAnalyzer(this.rootPath, uri);
            this.documentsAnalyzer[uri] = documentAnalyzer;
        }

        return documentAnalyzer;
    }

    public analyzeDocument(document: string, uri: string): Node | undefined {
        uri = decodeUriAndRemoveFilePrefix(uri);

        const documentAnalyzer = this.getDocumentAnalyzer(uri);
        return documentAnalyzer.analyze(this.documentsAnalyzer, document);
    }

    private findSolFiles(base: string | undefined, documentsUri: string[]): void {
        if (!base) {
            return;
        }

        base = decodeUriAndRemoveFilePrefix(base);

        try {
            const files = fs.readdirSync(base);

            files.forEach(file => {
                // if (file === "node_modules") {
                //     return;
                // }

                const newBase = path.join(base || "", file);

                if (fs.statSync(newBase).isDirectory()) {
                    this.findSolFiles(newBase, documentsUri);
                } else if (newBase.slice(-4) === ".sol") {
                    documentsUri.push(newBase);
                }
            });
        } catch (err) {
            console.error('Unable to scan directory: ' + err);
        }
    }

}

class DocumentAnalyzer implements IDocumentAnalyzer {
    rootPath: string;

    document: string | undefined;
    uri: string;

    ast: ASTNode | undefined;

    analyzerTree?: Node | undefined;
    isAnalyzed = false;

    orphanNodes: Node[] = [];

    constructor (rootPath: string, uri: string) {
        this.rootPath = rootPath;
        this.uri = uri;

        if (fs.existsSync(uri)) {
            this.document = "" + fs.readFileSync(uri);
        } else {
            this.document = "";
        }
    }

    public analyze(documentsAnalyzer: DocumentsAnalyzerMap, document?: string): Node | undefined {
        try {
            this.orphanNodes = [];

            if (document) {
                this.document = document;
            }

            this.ast = parser.parse(this.document || "", {
                loc: true,
                range: true,
                tolerant: true
            });

            if (this.isAnalyzed) {
                const oldDocumentsAnalyzerTree = this.analyzerTree as SourceUnitNode;

                for (const importNode of oldDocumentsAnalyzerTree.getImportNodes()) {
                    importNode.getParent()?.removeChild(importNode);
                    importNode.setParent(undefined);
                }
            }

            // console.log(this.uri, JSON.stringify(this.ast));

            this.isAnalyzed = true;
            this.analyzerTree = matcher.find(this.ast, this.uri, this.rootPath, documentsAnalyzer).accept(matcher.find, this.orphanNodes);

            return this.analyzerTree;
        } catch (err) {
            console.error(err);

            return this.analyzerTree;
        }
    }
}
