import { DocumentsAnalyzerMap, DocumentAnalyzer } from "@common/types";

const documentsAnalyzer: DocumentsAnalyzerMap = {};

export function getDocumentAnalyzer(uri: string): DocumentAnalyzer | undefined {
    return documentsAnalyzer[uri];
}

export function setDocumentAnalyzer(uri: string, documentAnalyzer: DocumentAnalyzer) {
    documentsAnalyzer[uri] = documentAnalyzer;
}
