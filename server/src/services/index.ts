import { Node } from "../../../parser/out/analyzer/nodes/Node";
import { Analyzer } from "../../../parser/out/analyzer";

import {
	LanguageSettings, Position, Hover, Location,
    WorkspaceEdit, TextDocument, HoverSettings
} from '../types/languageTypes';

import { SolidityNavigation } from './SolidityNavigation';
import { SolidityHover } from './SolidityHover';

export interface LanguageService {
    configure(raw?: LanguageSettings): void;
    analyzeDocument(document: string, uri: string): Node | undefined;
	findDefinition(uri: string, position: Position, analyzerTree: Node): Location | undefined;
	findTypeDefinition(uri: string, position: Position, analyzerTree: Node): Location[];
	findReferences(uri: string, position: Position, analyzerTree: Node): Location[];
	findImplementation(uri: string, position: Position, analyzerTree: Node): Location[];
	doRename(uri: string, document: TextDocument, position: Position, newName: string, analyzerTree: Node): WorkspaceEdit;
	doHover(document: TextDocument, position: Position, analyzerTree: Node, settings?: HoverSettings): Hover | undefined;
}

function createFacade(analyzer: Analyzer, navigation: SolidityNavigation, hover: SolidityHover): LanguageService {
	return {
        configure: (settings) => {
			hover.configure(settings?.hover);
		},
        analyzeDocument: analyzer.analyzeDocument.bind(analyzer),
		findDefinition: navigation.findDefinition.bind(navigation),
		findTypeDefinition: navigation.findTypeDefinition.bind(navigation),
		findReferences: navigation.findReferences.bind(navigation),
		findImplementation: navigation.findImplementation.bind(navigation),
		doRename: navigation.doRename.bind(navigation),
        doHover: hover.doHover.bind(hover)
	};
}

export function getLanguageServer(rootPath: string | undefined): LanguageService {
	return createFacade(
		new Analyzer(rootPath),
		new SolidityNavigation(),
		new SolidityHover()
	);
}
