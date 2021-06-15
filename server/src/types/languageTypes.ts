import { 
	Position, WorkspaceEdit, DocumentHighlight, TextEdit, Range,
	DocumentHighlightKind, MarkupKind, Definition, Hover, Location,
	CompletionList
} from 'vscode-languageserver-types';

import { TextDocument } from 'vscode-languageserver-textdocument';

export {
    TextDocument, Position, WorkspaceEdit, DocumentHighlight, TextEdit,
	Range, DocumentHighlightKind, MarkupKind, Definition, Hover, Location,
	CompletionList
};

export interface LanguageSettings {
	hover?: HoverSettings;
}

export interface HoverSettings {
	documentation?: boolean;
	references?: boolean
}
