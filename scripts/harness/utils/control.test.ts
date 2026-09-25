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
import type {
  NotificationWait,
  ServerNotification,
  SyncResult,
} from "./lsp.ts";
import type { DaemonState } from "./state.ts";

/**
 * A session that records what the routes asked of it. `onSend` runs inside
 * every request and notification, before it returns, so a test can have the
 * "server" answer with a notification as fast as possible.
 */
class StubSession implements ControlledSession {
  readonly calls: string[] = [];
  readonly readable = new Set(["contracts/A.sol", "contracts/B.sol"]);
  readonly unchanged = new Set<string>();
  readonly diagnostics = new Map<string, unknown[]>();
  readonly waiters = new Set<{
    method: string;
    uri?: string;
    resolve(notification: ServerNotification): void;
  }>();
  readonly log: ServerNotification[] = [];
  answer: () => Promise<unknown> = async () => ({ answered: true });
  onSend: (method: string, params: unknown) => void = () => {};

  async request(method: string, params?: unknown): Promise<unknown> {
    this.calls.push(`request ${method} ${JSON.stringify(params)}`);
    this.onSend(method, params);

    return this.answer();
  }

  async notify(method: string, params?: unknown): Promise<void> {
    this.calls.push(`notify ${method} ${JSON.stringify(params)}`);
    this.onSend(method, params);
  }

  async syncFromDisk(file: string): Promise<SyncResult> {
    this.calls.push(`sync ${file}`);

    if (this.unchanged.has(file)) {
      return { uri: this.uriFor(file), sent: null, version: 1 };
    }

    this.onSend("textDocument/didOpen", {
      textDocument: { uri: this.uriFor(file) },
    });

    return {
      uri: this.uriFor(file),
      sent: "textDocument/didOpen",
      version: 1,
    };
  }

  canRead(file: string): boolean {
    return this.readable.has(file);
  }

  uriFor(file: string): string {
    return `file:///ws/${file}`;
  }

  waitFor(method: string, uri?: string): NotificationWait {
    let waiter!: {
      method: string;
      uri?: string;
      resolve(notification: ServerNotification): void;
    };
    const received = new Promise<ServerNotification>((resolve) => {
      waiter = { method, uri, resolve };
    });
    this.waiters.add(waiter);

    return { received, cancel: () => this.waiters.delete(waiter) };
  }

  /** Deliver a notification, as the server would. */
  emit(method: string, uri: string): void {
    const notification = {
      seq: this.log.length + 1,
      at: "",
      method,
      params: { uri },
    };
    this.log.push(notification);

    for (const waiter of this.waiters) {
      if (waiter.method === method && (waiter.uri ?? uri) === uri) {
        this.waiters.delete(waiter);
        waiter.resolve(notification);
      }
    }
  }

  notifications(since = 0, method?: string) {
    return {
      notifications: this.log.filter(
        (n) => n.seq > since && (method === undefined || n.method === method)
      ),
      latest: this.log.length,
    };
  }
}

const servers: http.Server[] = [];

afterEach(() => {
  for (const server of servers.splice(0)) {
    server.close();
  }
});

async function serve({
  ready = true,
  requestTimeoutMs = 1_000,
  waitTimeoutMs = 1_000,
} = {}) {
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
    waitTimeoutMs,
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

    assert.equal((await call("GET", "/nope")).status, 404);
    assert.equal((await call("GET", "/message")).status, 404);
  });
});

describe("?waitFor=", () => {
  const didChange = (uri: string) =>
    JSON.stringify({
      method: "textDocument/didChange",
      params: { textDocument: { uri, version: 2 }, contentChanges: [] },
    });

  it("waits for the notification about the message's document", async () => {
    const { call, session } = await serve();
    // Delivered while the message is still being sent: only a wait set up
    // before sending can catch it.
    session.onSend = (_method, params: any) =>
      session.emit("custom/validated", params.textDocument.uri);

    const answer = await call(
      "POST",
      "/message?waitFor=custom/validated",
      didChange("file:///ws/A.sol")
    );

    assert.equal(answer.status, 200);
    assert.equal(answer.body.ok, true);
    assert.deepEqual(answer.body.notification.params, {
      uri: "file:///ws/A.sol",
    });
  });

  it("ignores the same notification about another document", async () => {
    const { call, session } = await serve({ waitTimeoutMs: 100 });
    session.onSend = () => session.emit("custom/validated", "file:///ws/B.sol");

    const answer = await call(
      "POST",
      "/message?waitFor=custom/validated",
      didChange("file:///ws/A.sol")
    );

    assert.equal(answer.status, 504);
    assert.equal(answer.body.ok, true);
    assert.match(
      answer.body.error.message,
      /custom\/validated was not received within 0\.1s/
    );
    assert.equal(session.waiters.size, 0);
  });

  it("takes its timeout from ?waitTimeoutMs=", async () => {
    const { call } = await serve({ waitTimeoutMs: 60_000 });

    const answer = await call(
      "POST",
      "/message?waitFor=custom/validated&waitTimeoutMs=50",
      didChange("file:///ws/A.sol")
    );

    assert.equal(answer.status, 504);
  });

  it("rejects a timeout that is not a positive number", async () => {
    const { call, session } = await serve();

    const answer = await call(
      "POST",
      "/message?waitFor=x&waitTimeoutMs=soon",
      didChange("file:///ws/A.sol")
    );

    assert.equal(answer.status, 400);
    assert.deepEqual(session.calls, []);
  });

  it("stops waiting when the request fails", async () => {
    const { call, session } = await serve();
    session.answer = async () => {
      throw new ResponseError(-32601, "Unhandled method m");
    };

    const answer = await call(
      "POST",
      "/message?waitFor=custom/validated",
      '{"id": 1, "method": "m"}'
    );

    assert.equal(answer.status, 200);
    assert.equal(answer.body.error.code, -32601);
    assert.equal(session.waiters.size, 0);
  });

  it("waits only for synced files something was sent for", async () => {
    const { call, session } = await serve();
    session.unchanged.add("contracts/B.sol");
    session.onSend = (_method, params: any) =>
      session.emit("custom/validated", params.textDocument.uri);

    const answer = await call(
      "POST",
      "/sync-from-disk?waitFor=custom/validated",
      JSON.stringify({ files: ["contracts/A.sol", "contracts/B.sol"] })
    );

    assert.equal(answer.status, 200);
    const [a, b] = answer.body.results;
    assert.deepEqual(a.notification.params, {
      uri: "file:///ws/contracts/A.sol",
    });
    assert.equal(b.sent, null);
    assert.equal(b.notification, undefined);
    assert.equal(session.waiters.size, 0);
  });

  it("names the synced files whose notification never came", async () => {
    const { call, session } = await serve({ waitTimeoutMs: 100 });

    const answer = await call(
      "POST",
      "/sync-from-disk?waitFor=custom/validated",
      JSON.stringify({ files: ["contracts/A.sol"] })
    );

    assert.equal(answer.status, 504);
    assert.equal(answer.body.results.length, 1);
    assert.match(answer.body.error.message, /for: contracts\/A\.sol$/);
  });
});

describe("GET /diagnostics", () => {
  it("answers for one file, one URI, or every document", async () => {
    const { call, session } = await serve({ ready: false });
    session.diagnostics.set("file:///ws/contracts/A.sol", [{ message: "a" }]);

    assert.deepEqual(
      (await call("GET", "/diagnostics?file=contracts/A.sol")).body,
      {
        uri: "file:///ws/contracts/A.sol",
        diagnostics: [{ message: "a" }],
      }
    );
    assert.deepEqual(
      (await call("GET", "/diagnostics?uri=file:///ws/contracts/A.sol")).body
        .diagnostics,
      [{ message: "a" }]
    );
    assert.deepEqual((await call("GET", "/diagnostics")).body, {
      diagnostics: { "file:///ws/contracts/A.sol": [{ message: "a" }] },
    });
  });

  it("answers null for a document with nothing published", async () => {
    const { call } = await serve();

    assert.deepEqual(
      (await call("GET", "/diagnostics?file=contracts/B.sol")).body,
      { uri: "file:///ws/contracts/B.sol", diagnostics: null }
    );
  });
});

describe("GET /notifications", () => {
  it("answers with what came after ?since=, optionally one method", async () => {
    const { call, session } = await serve({ ready: false });
    session.emit("custom/validated", "file:///ws/A.sol");
    session.emit("window/logMessage", "file:///ws/A.sol");
    session.emit("custom/validated", "file:///ws/B.sol");

    const all = (await call("GET", "/notifications?since=1")).body;
    assert.deepEqual(
      all.notifications.map((n: ServerNotification) => n.seq),
      [2, 3]
    );
    assert.equal(all.latest, 3);

    const validated = (
      await call("GET", "/notifications?method=custom/validated")
    ).body;
    assert.deepEqual(
      validated.notifications.map((n: ServerNotification) => n.seq),
      [1, 3]
    );
  });

  it("rejects a since that is not a notification number", async () => {
    const { call } = await serve();

    assert.equal((await call("GET", "/notifications?since=-1")).status, 400);
    assert.equal((await call("GET", "/notifications?since=x")).status, 400);
  });
});
