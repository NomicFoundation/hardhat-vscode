"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isArray = exports.isInstanceOf = exports.isDefined = exports.uriEqual = exports.rangeEqual = exports.getDocUri = exports.getDocPath = exports.changeDocument = exports.activate = exports.editor = exports.document = void 0;
const path = require("path");
const vscode = require("vscode");
const assert = require("assert");
/**
 * Activates the tenderly.solidity-extension extension
 */
async function activate(docUri) {
    // The extensionId is `publisher.name` from package.json
    const ext = vscode.extensions.getExtension('tenderly.solidity-extension');
    await ext.activate();
    try {
        exports.document = await vscode.workspace.openTextDocument(docUri);
        exports.editor = await vscode.window.showTextDocument(exports.document);
        await sleep(2000); // Wait for server activation
    }
    catch (e) {
        console.error(e);
    }
}
exports.activate = activate;
async function changeDocument(docUri) {
    try {
        exports.document = await vscode.workspace.openTextDocument(docUri);
        exports.editor = await vscode.window.showTextDocument(exports.document);
    }
    catch (e) {
        console.error(e);
    }
}
exports.changeDocument = changeDocument;
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
const getDocPath = (p) => {
    return path.resolve(__dirname, '../../src/test/testFixture', p);
};
exports.getDocPath = getDocPath;
const getDocUri = (p) => {
    return vscode.Uri.file(exports.getDocPath(p));
};
exports.getDocUri = getDocUri;
function rangeEqual(range, sl, sc, el, ec) {
    assert.strictEqual(range.start.line, sl);
    assert.strictEqual(range.start.character, sc);
    assert.strictEqual(range.end.line, el);
    assert.strictEqual(range.end.character, ec);
}
exports.rangeEqual = rangeEqual;
function uriEqual(actual, expected) {
    const actualPath = actual.path.match(/src\/test(.*)/)[0];
    const expectedPath = expected.path.match(/src\/test(.*)/)[0];
    assert.strictEqual(actualPath, expectedPath);
}
exports.uriEqual = uriEqual;
function isDefined(value) {
    if (value === undefined || value === null) {
        throw new Error(`Value is null or undefined`);
    }
}
exports.isDefined = isDefined;
function isInstanceOf(value, clazz) {
    assert.ok(value instanceof clazz);
}
exports.isInstanceOf = isInstanceOf;
function isArray(value, clazz, length = 1) {
    assert.ok(Array.isArray(value), `value is array`);
    assert.strictEqual(value.length, length, 'value has given length');
    if (length > 0) {
        assert.ok(value[0] instanceof clazz);
    }
}
exports.isArray = isArray;
//# sourceMappingURL=helper.js.map