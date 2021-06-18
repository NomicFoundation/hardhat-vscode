import * as fs from "fs";
import * as path from "path";
import * as parser from "@solidity-parser/parser";
import { ASTNode } from "@solidity-parser/parser/dist/src/ast-types";

import * as matcher from "@analyzer/matcher";
import * as cache from "@common/cache";
import { setProjectRootPath } from "@common/finder";
import { Node, SourceUnitNode, DocumentAnalyzer as IDocumentAnalyzer } from "@common/types";
import { decodeUriAndRemoveFilePrefix } from "@common/utils";

export class Analyzer {
    constructor (rootPath: string | undefined) {
        if (rootPath) {
            rootPath = decodeUriAndRemoveFilePrefix(rootPath);
        }

        setProjectRootPath(rootPath);

        const documentsUri: string[] = [];
        this.findSolFiles(rootPath, documentsUri);

        // Init all documentAnalyzers
        for (const documentUri of documentsUri) {
            cache.setDocumentAnalyzer(documentUri, new DocumentAnalyzer(documentUri));
        }

        for (const documentUri of documentsUri) {
            const documentAnalyzer = cache.getDocumentAnalyzer(documentUri);

            if (documentAnalyzer && !documentAnalyzer.analyzerTree) {
                documentAnalyzer.analyze();
            }
        }
    }

    public getDocumentAnalyzer(uri: string): DocumentAnalyzer | undefined {
        uri = decodeUriAndRemoveFilePrefix(uri);
        return cache.getDocumentAnalyzer(uri);
    }

    public analyzeDocument(document: string, uri: string): Node | undefined {
        uri = decodeUriAndRemoveFilePrefix(uri);

        let documentAnalyzer = cache.getDocumentAnalyzer(uri);

        if (documentAnalyzer) {
            return documentAnalyzer.analyze(document);
        }

        documentAnalyzer = new DocumentAnalyzer(uri);
        cache.setDocumentAnalyzer(uri, documentAnalyzer);

        return documentAnalyzer.analyze(document);
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
    document: string | undefined;
    uri: string;

    ast: ASTNode | undefined;

    analyzerTree?: Node;

    orphanNodes: Node[] = [];

    constructor (uri: string) {
        this.uri = uri;

        if (fs.existsSync(uri)) {
            this.document = "" + fs.readFileSync(uri);
        } else {
            this.document = "";
        }
    }

    public analyze(document?: string): Node | undefined {
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

            if (this.analyzerTree) {
                const oldDocumentsAnalyzerTree = this.analyzerTree as SourceUnitNode;

                for (const importNode of oldDocumentsAnalyzerTree.getImportNodes()) {
                    importNode.getParent()?.removeChild(importNode);
                    importNode.setParent(undefined);
                }
            }

            // console.log(this.uri, JSON.stringify(this.ast));

            this.analyzerTree = matcher.find(this.ast, this.uri).accept(matcher.find, this.orphanNodes);

            return this.analyzerTree;
        } catch (err) {
            console.error(err);

            return this.analyzerTree;
        }
    }
}
