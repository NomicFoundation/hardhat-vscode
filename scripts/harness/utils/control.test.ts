import assert from "node:assert/strict";
import type http from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, it } from "node:test";
import { ResponseError } from "vscode-jsonrpc/node";
import {
  CONTROL_HOST,
  type ControlledSession,
  createControlServer,
} from "./control.ts";
import type { SyncResult } from "./lsp.ts";
import type { DaemonState } from "./state.ts";

/** A session that records what the routes asked of it. */
class StubSession implements ControlledSession {
  readonly calls: string[] = [];
  readonly readable = new Set(["contracts/A.sol", "contracts/B.sol"]);
  answer: () => Promise<unknown> = async () => ({ answered: true });

  async request(method: string, params?: unknown): Promise<unknown> {
    this.calls.push(`request ${method} ${JSON.stringify(params)}`);

    return this.answer();
  }

  async notify(method: string, params?: unknown): Promise<void> {
    this.calls.push(`notify ${method} ${JSON.stringify(params)}`);
  }

  async syncFromDisk(file: string): Promise<SyncResult> {
    this.calls.push(`sync ${file}`);

    return { uri: `file:///${file}`, sent: "textDocument/didOpen", version: 1 };
  }

  canRead(file: string): boolean {
    return this.readable.has(file);
  }
}

const servers: http.Server[] = [];

afterEach(() => {
  for (const server of servers.splice(0)) {
    server.close();
  }
});

async function serve({ ready = true, requestTimeoutMs = 1_000 } = {}) {
  const session = new StubSession();
  const state: DaemonState = {
    pid: 1,
    workspace: "hardhat3",
    port: 0,
    startedAt: "2026-09-25T00:00:00.000Z",
    ready,
  };

  const server = createControlServer(() => state, session, {
    requestTimeoutMs,
  });
  servers.push(server);

  await new Promise<void>((resolve) => server.listen(0, CONTROL_HOST, resolve));

  const { port } = server.address() as AddressInfo;

  const call = async (method: string, route: string, body?: string) => {
    const response = await fetch(`http://${CONTROL_HOST}:${port}${route}`, {
      method,
      body,
    });

    return { status: response.status, body: await response.json() };
  };

  return { session, state, call };
}

describe("GET /ping", () => {
  it("answers with the daemon's state, ready or not", async () => {
    const { call, state } = await serve({ ready: false });

    assert.deepEqual(await call("GET", "/ping"), { status: 200, body: state });
  });
});

describe("POST /message", () => {
  it("forwards a message with an id as a request", async () => {
    const { call, session } = await serve();

    const answer = await call(
      "POST",
      "/message",
      JSON.stringify({ id: 1, method: "textDocument/hover", params: { a: 1 } })
    );

    assert.deepEqual(answer, {
      status: 200,
      body: { result: { answered: true } },
    });
    assert.deepEqual(session.calls, ['request textDocument/hover {"a":1}']);
  });

  it("forwards a message without an id as a notification", async () => {
    const { call, session } = await serve();

    const answer = await call(
      "POST",
      "/message",
      JSON.stringify({ method: "textDocument/didSave", params: { b: 2 } })
    );

    assert.deepEqual(answer, { status: 200, body: { ok: true } });
    assert.deepEqual(session.calls, ['notify textDocument/didSave {"b":2}']);
  });

  it("answers a null result as null", async () => {
    const { call, session } = await serve();
    session.answer = async () => undefined;

    const answer = await call("POST", "/message", '{"id": 1, "method": "m"}');

    assert.deepEqual(answer.body, { result: null });
  });

  it("passes the server's error through as a 200", async () => {
    const { call, session } = await serve();
    session.answer = async () => {
      throw new ResponseError(-32601, "Unhandled method m", { x: 1 });
    };

    const answer = await call("POST", "/message", '{"id": 1, "method": "m"}');

    assert.deepEqual(answer, {
      status: 200,
      body: {
        error: { code: -32601, message: "Unhandled method m", data: { x: 1 } },
      },
    });
  });

  it("answers 502 when the server has gone", async () => {
    const { call, session } = await serve();
    session.answer = async () => {
      throw new Error("The language server exited (code 1)");
    };

    const answer = await call("POST", "/message", '{"id": 1, "method": "m"}');

    assert.deepEqual(answer, {
      status: 502,
      body: { error: { message: "The language server exited (code 1)" } },
    });
  });

  it("answers 504 when a request is not answered in time", async () => {
    const { call, session } = await serve({ requestTimeoutMs: 100 });
    session.answer = () => new Promise(() => {});

    const answer = await call("POST", "/message", '{"id": 1, "method": "m"}');

    assert.equal(answer.status, 504);
    assert.match(answer.body.error.message, /m was not answered within 0\.1s/);
  });

  it("rejects a body that is not JSON, or has no method", async () => {
    const { call, session } = await serve();

    assert.equal((await call("POST", "/message", "{nope")).status, 400);
    assert.equal((await call("POST", "/message", '{"id": 1}')).status, 400);
    assert.deepEqual(session.calls, []);
  });
});

describe("POST /sync-from-disk", () => {
  it("syncs each file and answers with what was sent", async () => {
    const { call, session } = await serve();

    const answer = await call(
      "POST",
      "/sync-from-disk",
      JSON.stringify({ files: ["contracts/A.sol", "contracts/B.sol"] })
    );

    assert.equal(answer.status, 200);
    assert.equal(answer.body.results.length, 2);
    assert.deepEqual(session.calls, [
      "sync contracts/A.sol",
      "sync contracts/B.sol",
    ]);
  });

  it("syncs nothing if any file cannot be read", async () => {
    const { call, session } = await serve();

    const answer = await call(
      "POST",
      "/sync-from-disk",
      JSON.stringify({ files: ["contracts/A.sol", "contracts/Missing.sol"] })
    );

    assert.deepEqual(answer, {
      status: 400,
      body: { error: { message: "Cannot read: contracts/Missing.sol" } },
    });
    assert.deepEqual(session.calls, []);
  });

  it("rejects a body without a list of files", async () => {
    const { call } = await serve();

    for (const body of ["{}", '{"files": []}', '{"files": [1]}']) {
      assert.equal((await call("POST", "/sync-from-disk", body)).status, 400);
    }
  });
});

describe("before the daemon is ready", () => {
  it("answers 503 and forwards nothing", async () => {
    const { call, session } = await serve({ ready: false });

    const message = await call("POST", "/message", '{"id": 1, "method": "m"}');
    const sync = await call(
      "POST",
      "/sync-from-disk",
      '{"files": ["contracts/A.sol"]}'
    );

    assert.equal(message.status, 503);
    assert.equal(sync.status, 503);
    assert.deepEqual(session.calls, []);
  });
});

describe("an unknown route", () => {
  it("answers 404", async () => {
    const { call } = await serve();

    assert.equal((await call("GET", "/diagnostics")).status, 404);
    assert.equal((await call("GET", "/message")).status, 404);
  });
});
