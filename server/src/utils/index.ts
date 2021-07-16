import { TextDocument } from 'vscode-languageserver-textdocument';
import { TextDocumentIdentifier } from 'vscode-languageserver-protocol';

export function getUriFromDocument(document: TextDocument | TextDocumentIdentifier): string {
    return decodeUriAndRemoveFilePrefix(document.uri);
}

export function decodeUriAndRemoveFilePrefix(uri: string): string {
    if (uri && uri.includes('file://')) {
        uri = uri.replace("file://", "");
    }

    if (uri) {
        uri = decodeURIComponent(uri);
    }

    return uri;
}

export function debounce<Params extends any[]>(
        func: (...args: Params) => any,
        timeoutInMilliseconds: number
    ): (...args: Params) => void {
    let timer: NodeJS.Timeout;

    return (...args: Params) => {
        clearTimeout(timer);

        timer = setTimeout(() => {
            func(...args);
        }, timeoutInMilliseconds);
    };
}
