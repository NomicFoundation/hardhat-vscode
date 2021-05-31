import { TextDocument } from 'vscode-languageserver-textdocument';

export function getUriFromDocument (document: TextDocument): string {
    let uri = document.uri;

    if (uri.indexOf('file://') !== -1) {
        uri = uri.replace("file://", "");
    }

    return uri;
}
