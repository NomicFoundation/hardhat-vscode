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
	findDefinition(position: Position, analyzerTree: Node): Location | undefined;
	findTypeDefinition(position: Position, analyzerTree: Node): Location[];
	findReferences(position: Position, analyzerTree: Node): Location[];
	doRename(document: TextDocument, position: Position, newName: string, analyzerTree: Node): WorkspaceEdit;
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
		doRename: navigation.doRename.bind(navigation),
        doHover: hover.doHover.bind(hover)
	};
}

export const languageServer = createFacade(
    new Analyzer(),
    new SolidityNavigation(),
    new SolidityHover()
);
