import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { type LspMessageOptions, lspMessageRequest } from "./lsp-message.ts";

const uriFor = (file: string) => `file:///ws/${file}`;

function request(options: Partial<LspMessageOptions>) {
  return lspMessageRequest(
    { notification: false, syncFromDisk: false, files: [], ...options },
    uriFor
  );
}

describe("lspMessageRequest --message", () => {
  it("sends the message to /message as parsed JSON", () => {
    assert.deepEqual(request({ message: '{"id": 1, "method": "shutdown"}' }), {
      route: "/message",
      body: { id: 1, method: "shutdown" },
    });
  });

  it("rejects a message that is not JSON", () => {
    assert.throws(() => request({ message: "{nope" }), /not valid JSON/);
  });

  it("takes none of the options for building a message", () => {
    assert.throws(
      () => request({ message: "{}", line: "1", character: "1" }),
      /--message takes no --line/
    );
    assert.throws(
      () => request({ message: "{}", files: ["a.sol"] }),
      /--message takes no --file/
    );
  });
});

describe("lspMessageRequest --method", () => {
  it("builds a request with the document and a 0-based position", () => {
    assert.deepEqual(
      request({
        method: "textDocument/definition",
        files: ["contracts/Greeter.sol"],
        line: "15",
        character: "26",
      }),
      {
        route: "/message",
        body: {
          id: 1,
          method: "textDocument/definition",
          params: {
            textDocument: { uri: "file:///ws/contracts/Greeter.sol" },
            position: { line: 14, character: 25 },
          },
        },
      }
    );
  });

  it("merges --params over what it builds", () => {
    assert.deepEqual(
      request({
        method: "textDocument/references",
        files: ["A.sol"],
        line: "1",
        character: "1",
        params: '{"context": {"includeDeclaration": true}}',
      }).body,
      {
        id: 1,
        method: "textDocument/references",
        params: {
          textDocument: { uri: "file:///ws/A.sol" },
          position: { line: 0, character: 0 },
          context: { includeDeclaration: true },
        },
      }
    );
  });

  it("sends a notification, without an id, with --notification", () => {
    assert.deepEqual(
      request({
        method: "textDocument/didSave",
        files: ["A.sol"],
        notification: true,
      }).body,
      {
        method: "textDocument/didSave",
        params: { textDocument: { uri: "file:///ws/A.sol" } },
      }
    );
  });

  it("leaves out params when there is nothing to put in them", () => {
    assert.deepEqual(request({ method: "shutdown" }).body, {
      id: 1,
      method: "shutdown",
    });
  });

  it("rejects positions that do not count from 1", () => {
    for (const line of ["0", "-1", "1.5", "x"]) {
      assert.throws(
        () => request({ method: "m", files: ["A.sol"], line, character: "1" }),
        /--line must be a whole number from 1/
      );
    }
  });

  it("needs both --line and --character, and a --file for them", () => {
    assert.throws(
      () => request({ method: "m", files: ["A.sol"], line: "1" }),
      /--line and --character go together/
    );
    assert.throws(
      () => request({ method: "m", line: "1", character: "1" }),
      /need a --file/
    );
  });

  it("takes one --file, and --params only as a JSON object", () => {
    assert.throws(
      () => request({ method: "m", files: ["A.sol", "B.sol"] }),
      /at most one --file/
    );
    assert.throws(
      () => request({ method: "m", params: "[1]" }),
      /--params must be a JSON object/
    );
  });
});

describe("lspMessageRequest --sync-from-disk", () => {
  it("sends the files to /sync-from-disk", () => {
    assert.deepEqual(
      request({
        syncFromDisk: true,
        files: ["contracts/A.sol", "contracts/B.sol"],
      }),
      {
        route: "/sync-from-disk",
        body: { files: ["contracts/A.sol", "contracts/B.sol"] },
      }
    );
  });

  it("needs a file, and takes none of the options for building a message", () => {
    assert.throws(
      () => request({ syncFromDisk: true }),
      /needs at least one --file/
    );
    assert.throws(
      () => request({ syncFromDisk: true, files: ["A.sol"], params: "{}" }),
      /--sync-from-disk takes no --params/
    );
  });
});

describe("lspMessageRequest modes and waiting", () => {
  it("needs exactly one mode", () => {
    for (const options of [
      {},
      { message: "{}", method: "m" },
      { message: "{}", syncFromDisk: true, files: ["A.sol"] },
      { method: "m", syncFromDisk: true, files: ["A.sol"] },
    ]) {
      assert.throws(() => request(options), /exactly one of/);
    }
  });

  it("adds --wait-for and --wait-timeout to the route of any mode", () => {
    assert.equal(
      request({
        syncFromDisk: true,
        files: ["A.sol"],
        waitFor: "custom/validated",
        waitTimeout: "5000",
      }).route,
      "/sync-from-disk?waitFor=custom%2Fvalidated&waitTimeoutMs=5000"
    );
    assert.equal(
      request({ message: '{"method": "m"}', waitFor: "custom/validated" })
        .route,
      "/message?waitFor=custom%2Fvalidated"
    );
  });

  it("rejects --wait-timeout without --wait-for", () => {
    assert.throws(
      () => request({ method: "m", waitTimeout: "100" }),
      /only used with --wait-for/
    );
  });
});
