import { Node, DocumentAnalyzer } from "../../../parser/out/types";
import { Analyzer } from "../../../parser";

import {
	Position, Location, WorkspaceEdit,
	TextDocument, CompletionList
} from '../types/languageTypes';

import { SolidityNavigation } from './SolidityNavigation';
import { SolidityCompletion } from './SolidityCompletion';

export interface LanguageService {
	getDocumentAnalyzer(uri: string): DocumentAnalyzer | undefined;
    analyzeDocument(document: string, uri: string): Node | undefined;
	findDefinition(uri: string, position: Position, analyzerTree: Node): Location | undefined;
	findTypeDefinition(uri: string, position: Position, analyzerTree: Node): Location[];
	findReferences(uri: string, position: Position, analyzerTree: Node): Location[];
	findImplementation(uri: string, position: Position, analyzerTree: Node): Location[];
	doRename(uri: string, document: TextDocument, position: Position, newName: string, analyzerTree: Node): WorkspaceEdit;
	doComplete(rootPath: string, position: Position, documentAnalyzer: DocumentAnalyzer): CompletionList;
}

function createFacade(analyzer: Analyzer, navigation: SolidityNavigation, completion: SolidityCompletion): LanguageService {
	return {
		getDocumentAnalyzer: analyzer.getDocumentAnalyzer.bind(analyzer),
        analyzeDocument: analyzer.analyzeDocument.bind(analyzer),
		findDefinition: navigation.findDefinition.bind(navigation),
		findTypeDefinition: navigation.findTypeDefinition.bind(navigation),
		findReferences: navigation.findReferences.bind(navigation),
		findImplementation: navigation.findImplementation.bind(navigation),
		doRename: navigation.doRename.bind(navigation),
		doComplete: completion.doComplete.bind(completion)
	};
}

export function getLanguageServer(rootPath: string | undefined): LanguageService {
	return createFacade(
		new Analyzer(rootPath),
		new SolidityNavigation(),
		new SolidityCompletion()
	);
}
