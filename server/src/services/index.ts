import { Analyzer } from "../../../parser/out";
import { Node } from "../../../parser/out/analyzer/nodes/Node";

import { SolidityNavigation } from './SolidityNavigation';
import { SolidityHover } from './SolidityHover';

import {
	LanguageSettings, Position, Hover, Location, DocumentHighlight,
    WorkspaceEdit, TextDocument, HoverSettings
} from '../types/languageTypes';

export interface LanguageService {
    configure(raw?: LanguageSettings): void;
    analyzeDocument(document: string, uri: string): void;
	doHover(document: TextDocument, position: Position, analyzerTree: Node, settings?: HoverSettings): Hover | undefined;
	findDefinition(document: TextDocument, position: Position, analyzerTree: Node): Location | undefined;
	findReferences(document: TextDocument, position: Position, analyzerTree: Node): Location[];
	findDocumentHighlights(document: TextDocument, position: Position, analyzerTree: Node): DocumentHighlight[];
	doRename(document: TextDocument, position: Position, newName: string, analyzerTree: Node): WorkspaceEdit;
}

function createFacade(analyzer: Analyzer, navigation: SolidityNavigation, hover: SolidityHover): LanguageService {
	return {
        configure: (settings) => {
			hover.configure(settings?.hover);
		},
        analyzeDocument: analyzer.analyzeDocument.bind(analyzer),
		findDefinition: navigation.findDefinition.bind(navigation),
		findReferences: navigation.findReferences.bind(navigation),
		findDocumentHighlights: navigation.findDocumentHighlights.bind(navigation),
		doRename: navigation.doRename.bind(navigation),
        doHover: hover.doHover.bind(hover)
	};
}

export function getLanguageService(): LanguageService {
	return createFacade(
		new Analyzer(),
        new SolidityNavigation(),
        new SolidityHover()
	);
}
