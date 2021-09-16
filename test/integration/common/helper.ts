'use strict';

import * as path from 'path';
import * as vscode from 'vscode';
import * as assert from 'assert';

export async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function getDocPath(dirname: string, p: string): string {
    // TO-DO: Refactor this
    dirname = dirname.replace('/out/', '/');
    return path.resolve(dirname, 'testdata', p);
}

export function getDocUri(dirname: string, p: string): vscode.Uri {
    return vscode.Uri.file(getDocPath(dirname, p));
}

export function rangeEqual(range: vscode.Range, sl: number, sc: number, el: number, ec: number): void {
    assert.strictEqual(range.start.line, sl);
    assert.strictEqual(range.start.character, sc);
    assert.strictEqual(range.end.line, el);
    assert.strictEqual(range.end.character, ec);
}

export function uriEqual(actual: vscode.Uri, expected: vscode.Uri): void {
    let actualPath: string = actual.path;
    let expectedPath: string = expected.path;
    
    const actualPathExp = actual.path.match(/testdata\/(.*)/);
	const expectedPathExp = expected.path.match(/.\/(.*)/);

    if (actualPathExp && actualPathExp.length > 0) {
        actualPath = actualPathExp[1];
    }
    if (expectedPathExp && expectedPathExp.length > 0) {
        expectedPath = expectedPathExp[1];
    }

    assert.strictEqual(actualPath, expectedPath);
}

export function isDefined<T>(value: T | undefined | null): asserts value is Exclude<T, undefined | null> {
    if (value === undefined || value === null) {
        throw new Error(`Value is null or undefined`);
    }
}

export function isInstanceOf<T>(value: T, clazz: any): asserts value is Exclude<T, undefined | null> {
    assert.ok(value instanceof clazz);
}

export function isArray<T>(value: Array<T> | undefined | null, length = 1): asserts value is Array<T> {
    assert.ok(Array.isArray(value), `value must be array`);
    assert.strictEqual(value!.length, length, 'value invalid length');
}
