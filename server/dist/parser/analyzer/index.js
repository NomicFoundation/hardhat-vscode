"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Analyzer = void 0;
require("module-alias/register");
const fs = require("fs");
const path = require("path");
const parser = require("@solidity-parser/parser");
const matcher = require("@analyzer/matcher");
const searcher_1 = require("@analyzer/searcher");
const types_1 = require("@common/types");
class Analyzer {
    constructor(rootPath) {
        this.documentsAnalyzer = {};
        this.rootPath = rootPath;
        const documentsUri = [];
        this.findSolFiles(this.rootPath, documentsUri);
        // Init all documentAnalyzers
        for (const documentUri of documentsUri) {
            this.documentsAnalyzer[documentUri] = new DocumentAnalyzer(this.rootPath, documentUri);
        }
        // We will initialize all DocumentAnalizers first, because when we analyze documents we enter to their imports and
        // if they are not analyzed we analyze them, in order to be able to analyze imports we need to have DocumentAnalizer and
        // therefore we initiate everything first. The isAnalyzed serves to check if the document was analyzed so we don't analyze the document twice.
        for (const documentUri of documentsUri) {
            const documentAnalyzer = this.getDocumentAnalyzer(documentUri);
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
    getDocumentAnalyzer(uri) {
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
    analyzeDocument(document, uri) {
        const documentAnalyzer = this.getDocumentAnalyzer(uri);
        return documentAnalyzer.analyze(this.documentsAnalyzer, document);
    }
    findSolFiles(base, documentsUri) {
        if (!base) {
            return;
        }
        try {
            const files = fs.readdirSync(base);
            files.forEach(file => {
                // if (file === "node_modules") {
                //     return;
                // }
                const newBase = path.join(base || "", file);
                if (fs.statSync(newBase).isDirectory()) {
                    this.findSolFiles(newBase, documentsUri);
                }
                else if (newBase.slice(-4) === ".sol") {
                    documentsUri.push(newBase);
                }
            });
        }
        catch (err) {
            console.error('Unable to scan directory: ' + err);
        }
    }
}
exports.Analyzer = Analyzer;
class DocumentAnalyzer {
    constructor(rootPath, uri) {
        this.isAnalyzed = false;
        this.orphanNodes = [];
        this.rootPath = rootPath;
        this.uri = uri;
        this.analyzerTree = { tree: new types_1.EmptyNode({ type: "Empty" }, this.uri, this.rootPath, {}) };
        this.searcher = new searcher_1.Searcher(this.analyzerTree);
        if (fs.existsSync(uri)) {
            this.document = "" + fs.readFileSync(uri);
        }
        else {
            this.document = "";
        }
    }
    analyze(documentsAnalyzer, document) {
        var _a;
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
                const oldDocumentsAnalyzerTree = this.analyzerTree.tree;
                for (const importNode of oldDocumentsAnalyzerTree.getImportNodes()) {
                    (_a = importNode.getParent()) === null || _a === void 0 ? void 0 : _a.removeChild(importNode);
                    importNode.setParent(undefined);
                }
            }
            // console.log(this.uri, JSON.stringify(this.ast));
            this.isAnalyzed = true;
            this.analyzerTree.tree = matcher.find(this.ast, this.uri, this.rootPath, documentsAnalyzer).accept(matcher.find, this.orphanNodes);
            return this.analyzerTree.tree;
        }
        catch (err) {
            console.error(err);
            return this.analyzerTree.tree;
        }
    }
}
//# sourceMappingURL=index.js.map