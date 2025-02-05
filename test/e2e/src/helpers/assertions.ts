/* eslint-disable no-console */
"use strict";
import * as vscode from "vscode";
import * as assert from "assert";
import { getCurrentEditor } from "./editor";
import { sleep } from "./sleep";

export function rangeEqual(
  range: vscode.Range,
  sl: number,
  sc: number,
  el: number,
  ec: number
): void {
  assert.strictEqual(range.start.line, sl);
  assert.strictEqual(range.start.character, sc);
  assert.strictEqual(range.end.line, el);
  assert.strictEqual(range.end.character, ec);
}

export function assertPositionEqual(
  position1: vscode.Position,
  position2: vscode.Position
): void {
  assert.strictEqual(position1.character, position2.character);
  assert.strictEqual(position1.line, position2.line);
}

export function uriEqual(
  actual: vscode.Uri,
  expected: vscode.Uri,
  message?: string
): void {
  let actualPath: string = actual.path;
  let expectedPath: string = expected.path;

  const actualPathExp = actual.path.match(/testdata\/(.*)/);
  const expectedPathExp = expected.path.match(/^.\/(.*)/);

  if (actualPathExp && actualPathExp.length > 0) {
    actualPath = actualPathExp[1];
  }
  if (expectedPathExp && expectedPathExp.length > 0) {
    expectedPath = expectedPathExp[1];
  }

  assert.strictEqual(actualPath, expectedPath, message);
}

export function isDefined<T>(
  value: T | undefined | null
): asserts value is Exclude<T, undefined | null> {
  if (value === undefined || value === null) {
    throw new Error(`Value is null or undefined`);
  }
}

export function isInstanceOf<T>(
  value: T,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  clazz: any
): asserts value is Exclude<T, undefined | null> {
  assert.ok(value instanceof clazz);
}

export function isArray<T>(
  value: T[] | undefined | null,
  length = 1
): asserts value is T[] {
  assert.ok(
    Array.isArray(value),
    `value must be array ${JSON.stringify(value, null, 2)}`
  );
  assert.strictEqual(value.length, length, "value invalid length");
}

/**
 * Assert a diagnostic is present in the given file, or listen to future
 * diagnostics and resolve once a matching one arrives
 */
export async function checkOrWaitDiagnostic(
  uri: vscode.Uri,
  range: vscode.Range,
  severity: vscode.DiagnosticSeverity,
  source: string,
  message: string,
  debug = false
) {
  await new Promise((resolve, _reject) => {
    const checkDiagnostics = () => {
      const diagnostics = vscode.languages.getDiagnostics(uri);

      if (diagnostics.length === 0) return;

      if (
        diagnostics.some(
          (diagnostic) =>
            diagnostic.range.isEqual(range) &&
            diagnostic.severity === severity &&
            diagnostic.source === source &&
            diagnostic.message.includes(message)
        )
      ) {
        resolve(true);
      } else if (debug) {
        console.log(
          `Got diagnostics but didnt match: ${JSON.stringify(
            diagnostics,
            null,
            2
          )}`
        );
      }
    };

    checkDiagnostics();
    vscode.languages.onDidChangeDiagnostics(checkDiagnostics);
  });
}

const TIMEOUT = 20000;
export async function assertCurrentTabFile(expectedUri: string) {
  const start = new Date().getTime();
  let currentUri = "";

  while (new Date().getTime() - start < TIMEOUT) {
    currentUri = getCurrentEditor().document.fileName;
    if (currentUri === expectedUri) return;
    await sleep(100);
  }

  throw new Error(
    `Waited ${TIMEOUT} ms for current tab to be ${expectedUri} but it was ${currentUri}`
  );
}
