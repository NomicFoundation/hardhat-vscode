import * as fs from "fs";
import * as path from "path";
import { TextDocument } from 'vscode-languageserver-textdocument';
import { TextDocumentIdentifier } from 'vscode-languageserver-protocol';

import { Position, Range } from '../types/languageTypes';
import { types } from "solidity-analyzer";

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

export function findNodeModules(fromURI: string, projectRootPath: string): string | undefined {
    let nodeModulesPath = path.join(fromURI, "..", "node_modules");

    while (projectRootPath && nodeModulesPath.includes(projectRootPath) && !fs.existsSync(nodeModulesPath)) {
        nodeModulesPath = path.join(nodeModulesPath, "..", "..", "node_modules");
    }

    if (fs.existsSync(nodeModulesPath)) {
        return nodeModulesPath;
    }

    return undefined;
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

export function getParserPositionFromVSCodePosition(position: Position): types.Position {
    return {
        // TO-DO: Remove +1 when "@solidity-parser" fix line counting.
        // Why +1? Because "vs-code" line counting from 0, and "@solidity-parser" from 1.
        line: position.line + 1,
        column: position.character
    };
}

export function getRange(loc: types.Location): Range {
    // TO-DO: Remove -1 when "@solidity-parser" fix line counting.
    // Why -1? Because "vs-code" line counting from 0, and "@solidity-parser" from 1.
    return Range.create(
        Position.create(loc.start.line - 1, loc.start.column),
        Position.create(loc.end.line - 1, loc.end.column),
    );
}
