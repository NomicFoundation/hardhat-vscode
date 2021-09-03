import { TextDocument } from 'vscode-languageserver-textdocument';
import { TextDocumentIdentifier } from 'vscode-languageserver-protocol';
export declare function getUriFromDocument(document: TextDocument | TextDocumentIdentifier): string;
export declare function decodeUriAndRemoveFilePrefix(uri: string): string;
export declare function debounce<Params extends any[]>(func: (...args: Params) => any, timeoutInMilliseconds: number): (...args: Params) => void;
