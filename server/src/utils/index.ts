import { TextDocument } from 'vscode-languageserver-textdocument';

export function getUriFromDocument (document: TextDocument): string {
    let uri = document.uri;

    if (uri && uri.indexOf('file://') !== -1) {
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
