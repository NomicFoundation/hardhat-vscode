import "module-alias/register";
import { Node, DocumentsAnalyzerMap, DocumentAnalyzer as IDocumentAnalyzer, ASTNode, Searcher as ISearcher } from "@common/types";
export declare class Analyzer {
    rootPath: string;
    documentsAnalyzer: DocumentsAnalyzerMap;
    constructor(rootPath: string);
    /**
     * Get or create and get DocumentAnalyzer.
     *
     * @param uri The path to the file with the document.
     * Uri needs to be decoded and without the "file://" prefix.
     */
    getDocumentAnalyzer(uri: string): DocumentAnalyzer;
    /**
     * @param uri The path to the file with the document.
     */
    analyzeDocument(document: string, uri: string): Node | undefined;
    private findSolFiles;
}
declare class DocumentAnalyzer implements IDocumentAnalyzer {
    rootPath: string;
    document: string | undefined;
    uri: string;
    ast: ASTNode | undefined;
    analyzerTree: {
        tree: Node;
    };
    isAnalyzed: boolean;
    searcher: ISearcher;
    orphanNodes: Node[];
    constructor(rootPath: string, uri: string);
    analyze(documentsAnalyzer: DocumentsAnalyzerMap, document?: string): Node | undefined;
}
export {};
