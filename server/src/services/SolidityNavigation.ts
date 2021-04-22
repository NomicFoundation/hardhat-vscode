import { Node } from "../../../parser/out/analyzer/nodes/Node";

import { TextDocument, Position, Location, DocumentHighlight, WorkspaceEdit } from '../types/languageTypes';

export class SolidityNavigation {
	public findDefinition(document: TextDocument, position: Position, analyzerTree: Node): Location | undefined {
		// TO-DO: Implement findDefinition
		return undefined;
	}

	public findReferences(document: TextDocument, position: Position, analyzerTree: Node): Location[] {
		// TO-DO: Implement findReferences
        return [];
	}

	public findDocumentHighlights(document: TextDocument, position: Position, analyzerTree: Node): DocumentHighlight[] {
		// TO-DO: Implement findDocumentHighlights
        return [];
	}

	public doRename(document: TextDocument, position: Position, newName: string, analyzerTree: Node): WorkspaceEdit {
		// TO-DO: Implement doRename
		return {};
	}
}
