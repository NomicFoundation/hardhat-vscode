import "module-alias/register";

import * as fs from "fs";
import * as path from "path";
import * as parser from "@solidity-parser/parser";

import * as matcher from "@analyzer/matcher";
import { Searcher } from "@analyzer/searcher";
import { IndexFileData, eventEmitter as em } from '@common/event';
import {
    Node, SourceUnitNode, DocumentsAnalyzerMap,
    DocumentAnalyzer as IDocumentAnalyzer, ASTNode,
    EmptyNode, Searcher as ISearcher
} from "@common/types";

export class Analyzer {
    rootPath: string;

    documentsAnalyzer: DocumentsAnalyzerMap = {};

    constructor(rootPath: string) {
        this.rootPath = rootPath;

        const documentsUri: string[] = [];
        this.findSolFiles(this.rootPath, documentsUri);

        // Init all documentAnalyzers
        for (const documentUri of documentsUri) {
            this.documentsAnalyzer[documentUri] = new DocumentAnalyzer(this.rootPath, documentUri);
        }

        // We will initialize all DocumentAnalizers first, because when we analyze documents we enter to their imports and
        // if they are not analyzed we analyze them, in order to be able to analyze imports we need to have DocumentAnalizer and
        // therefore we initiate everything first. The isAnalyzed serves to check if the document was analyzed so we don't analyze the document twice.
        for (let i = 0; i < documentsUri.length; i++) {
            const documentUri = documentsUri[i];
            const documentAnalyzer = this.getDocumentAnalyzer(documentUri);
            // if (documentAnalyzer.uri.includes("node_modules")) {
            //     continue;
            // }

            const data: IndexFileData = {
                path: documentUri,
                current: i + 1,
                total: documentsUri.length
            };
            em.emit('indexing-file', data);

            if (!documentAnalyzer.isAnalyzed) {
                documentAnalyzer.analyze(this.documentsAnalyzer);
            }
        }
    }

    /**
     * Get or create and get DocumentAnalyzer.
     * 
     * @param uri The path to the file with the document.
     * Uri needs to be decoded and without the "file://" prefix.
     */
    public getDocumentAnalyzer(uri: string): DocumentAnalyzer {
        let documentAnalyzer = this.documentsAnalyzer[uri];

        if (!documentAnalyzer) {
            documentAnalyzer = new DocumentAnalyzer(this.rootPath, uri);
            this.documentsAnalyzer[uri] = documentAnalyzer;
        }

        return documentAnalyzer;
    }

    /**
     * @param uri The path to the file with the document.
     */
    public analyzeDocument(document: string, uri: string): Node | undefined {
        const documentAnalyzer = this.getDocumentAnalyzer(uri);
        return documentAnalyzer.analyze(this.documentsAnalyzer, document);
    }

    private findSolFiles(base: string | undefined, documentsUri: string[]): void {
        if (!base) {
            return;
        }

        try {
            const files = fs.readdirSync(base);

            files.forEach(file => {
                const newBase = path.join(base || "", file);

                if (fs.statSync(newBase).isDirectory()) {
                    this.findSolFiles(newBase, documentsUri);
                } else if (
                    newBase.slice(-4) === ".sol" &&
                    newBase.split("node_modules").length < 3 &&
                    !documentsUri.includes(newBase)
                ) {
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

    analyzerTree: { tree: Node };
    isAnalyzed = false;

    searcher: ISearcher;

    orphanNodes: Node[] = [];

    constructor(rootPath: string, uri: string) {
        this.rootPath = rootPath;
        this.uri = uri;

        this.analyzerTree = { tree: new EmptyNode({ type: "Empty" }, this.uri, this.rootPath, {}) };
        this.searcher = new Searcher(this.analyzerTree);

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
                const oldDocumentsAnalyzerTree = this.analyzerTree.tree as SourceUnitNode;

                for (const importNode of oldDocumentsAnalyzerTree.getImportNodes()) {
                    importNode.getParent()?.removeChild(importNode);
                    importNode.setParent(undefined);
                }
            }

            // console.log(this.uri, JSON.stringify(this.ast));

            this.isAnalyzed = true;
            this.analyzerTree.tree = matcher.find(this.ast, this.uri, this.rootPath, documentsAnalyzer).accept(matcher.find, this.orphanNodes);

            return this.analyzerTree.tree;
        } catch (err) {
            // console.error(err);
            return this.analyzerTree.tree;
        }
    }
}
