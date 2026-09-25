import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { lspMessageRequest } from "./lsp-message.ts";

describe("lspMessageRequest", () => {
  it("sends --message to /message as parsed JSON", () => {
    assert.deepEqual(
      lspMessageRequest({
        message: '{"id": 1, "method": "shutdown"}',
        syncFromDisk: false,
        files: [],
      }),
      { route: "/message", body: { id: 1, method: "shutdown" } }
    );
  });

  it("sends --sync-from-disk files to /sync-from-disk", () => {
    assert.deepEqual(
      lspMessageRequest({
        syncFromDisk: true,
        files: ["contracts/A.sol", "contracts/B.sol"],
      }),
      {
        route: "/sync-from-disk",
        body: { files: ["contracts/A.sol", "contracts/B.sol"] },
      }
    );
  });

  it("refuses to combine --sync-from-disk with --message", () => {
    assert.throws(
      () =>
        lspMessageRequest({
          message: '{"method": "exit"}',
          syncFromDisk: true,
          files: ["contracts/A.sol"],
        }),
      /takes no --message/
    );
  });

  it("needs a file to sync", () => {
    assert.throws(
      () => lspMessageRequest({ syncFromDisk: true, files: [] }),
      /needs at least one --file/
    );
  });

  it("rejects --file without --sync-from-disk", () => {
    assert.throws(
      () =>
        lspMessageRequest({
          message: '{"method": "exit"}',
          syncFromDisk: false,
          files: ["contracts/A.sol"],
        }),
      /only used with --sync-from-disk/
    );
  });

  it("needs one of the two modes", () => {
    assert.throws(
      () => lspMessageRequest({ syncFromDisk: false, files: [] }),
      /needs --message <json> or --sync-from-disk/
    );
  });

  it("rejects a --message that is not JSON", () => {
    assert.throws(
      () =>
        lspMessageRequest({ message: "{nope", syncFromDisk: false, files: [] }),
      /not valid JSON/
    );
  });
});
