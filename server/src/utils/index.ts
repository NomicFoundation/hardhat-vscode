import { TextDocument } from 'vscode-languageserver-textdocument';
import { TextDocumentIdentifier } from 'vscode-languageserver-protocol';

import { Position, Range } from '../types/languageTypes';
import {
    Position as ParserPosition,
    Location as ParserLocation
} from "../../../parser/out/types";

export function getUriFromDocument (document: TextDocument | TextDocumentIdentifier): string {
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

export function getParserPositionFromVSCodePosition(position: Position): ParserPosition {
    return {
        // TO-DO: Remove +1 when "@solidity-parser" fix line counting.
        // Why +1? Because "vs-code" line counting from 0, and "@solidity-parser" from 1.
        line: position.line + 1,
        column: position.character
    };
}

export function getRange(loc: ParserLocation): Range {
    // TO-DO: Remove -1 when "@solidity-parser" fix line counting.
    // Why -1? Because "vs-code" line counting from 0, and "@solidity-parser" from 1.
    return Range.create(
        Position.create(loc.start.line - 1, loc.start.column),
        Position.create(loc.end.line - 1, loc.end.column),
    );
}
