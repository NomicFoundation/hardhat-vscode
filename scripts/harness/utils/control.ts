import http from "node:http";
import { ResponseError } from "vscode-jsonrpc/node";
import {
  type NotificationWait,
  notificationUri,
  type ServerNotification,
  type SyncResult,
} from "./lsp.ts";
import {
  type DaemonState,
  readDaemonState,
  runningDaemonPid,
} from "./state.ts";

export const CONTROL_HOST = "127.0.0.1";

/** The part of a session the control routes drive. */
export interface ControlledSession {
  request(method: string, params?: unknown): Promise<unknown>;
  notify(method: string, params?: unknown): Promise<void>;
  syncFromDisk(file: string): Promise<SyncResult>;
  canRead(file: string): boolean;
  uriFor(file: string): string;
  waitFor(method: string, uri?: string): NotificationWait;
  notifications(
    since?: number,
    method?: string
  ): { notifications: ServerNotification[]; latest: number };
  readonly diagnostics: Map<string, unknown[]>;
}

export interface ControlOptions {
  /** How long a forwarded request may take before the route gives up. */
  requestTimeoutMs?: number;
  /** How long `waitFor` waits by default, when the query gives no timeout. */
  waitTimeoutMs?: number;
}

type Answer = [status: number, body: Record<string, unknown>];

/**
 * The daemon's control endpoint, on 127.0.0.1 only:
 *
 *   GET  /ping            the daemon's state, including whether it is ready
 *   POST /message         one JSON-RPC message, passed through as given: with
 *                         an `id` it is a request, answered with { result }
 *                         or the server's { error }; without, a
 *                         notification, answered with { ok: true }
 *   POST /sync-from-disk  { files: [...] }: bring the server's copy of each
 *                         file up to date with the disk, sending only didOpen
 *                         or didChange, and answer with what was sent
 *   GET  /diagnostics     the latest diagnostics for ?file= or ?uri=, or for
 *                         every document
 *   GET  /notifications   what the server has sent after ?since=<seq>,
 *                         optionally only ?method=
 *
 * The two POST routes take ?waitFor=<method> (and ?waitTimeoutMs=): the
 * answer then waits for that notification about the same document, which is
 * listened for before anything is sent. It adds `notification` to the
 * answer, or to each sync result that sent something.
 *
 * HTTP status codes are for the harness's own faults: 400 for a malformed
 * body, 503 before the daemon is ready, 502 when the server has gone, 504
 * when a request or a wait times out. An error the server answers with is a
 * 200.
 */
export function createControlServer(
  state: () => DaemonState,
  session: ControlledSession,
  { requestTimeoutMs = 30_000, waitTimeoutMs = 30_000 }: ControlOptions = {}
): http.Server {
  return http.createServer(async (request, response) => {
    const reply = ([status, body]: Answer) => {
      response.writeHead(status, { "content-type": "application/json" });
      response.end(JSON.stringify(body));
    };

    const url = new URL(request.url ?? "/", `http://${CONTROL_HOST}`);
    const route = `${request.method} ${url.pathname}`;
    const query = url.searchParams;

    switch (route) {
      case "GET /ping":
        return reply([200, { ...state() }]);
      case "GET /diagnostics":
        return reply(diagnostics(session, query));
      case "GET /notifications":
        return reply(notifications(session, query));
      case "POST /message":
      case "POST /sync-from-disk":
        break;
      default:
        return reply(fault(404, `No route ${route}`));
    }

    if (!state().ready) {
      return reply(fault(503, "The daemon is not ready yet"));
    }

    let body: unknown;

    try {
      body = JSON.parse(await readBody(request));
    } catch {
      return reply(fault(400, "The body is not JSON"));
    }

    const waitFor = query.get("waitFor") ?? undefined;
    const timeoutMs = Number(query.get("waitTimeoutMs") ?? waitTimeoutMs);

    if (Number.isNaN(timeoutMs) || timeoutMs <= 0) {
      return reply(fault(400, "waitTimeoutMs must be a positive number"));
    }

    const wait = waitFor === undefined ? undefined : { waitFor, timeoutMs };

    try {
      return reply(
        route === "POST /message"
          ? await forwardMessage(session, body, requestTimeoutMs, wait)
          : await syncFiles(session, body, wait)
      );
    } catch (error) {
      return reply(
        fault(502, error instanceof Error ? error.message : `${error}`)
      );
    }
  });
}

interface Wait {
  waitFor: string;
  timeoutMs: number;
}

async function forwardMessage(
  session: ControlledSession,
  body: unknown,
  requestTimeoutMs: number,
  wait: Wait | undefined
): Promise<Answer> {
  if (!isMessage(body)) {
    return fault(400, "A message needs a string `method`");
  }

  const { method, params } = body;

  // Listen before sending, so a fast notification cannot be missed.
  const pending =
    wait && session.waitFor(wait.waitFor, notificationUri(params));

  let answer: Record<string, unknown>;

  try {
    answer = await send(session, body, requestTimeoutMs);
  } catch (error) {
    pending?.cancel();

    if (error instanceof ResponseError) {
      return [
        200,
        {
          error: { code: error.code, message: error.message, data: error.data },
        },
      ];
    }

    if (error instanceof Timeout) {
      return fault(
        504,
        `${method} was not answered within ${seconds(requestTimeoutMs)}`
      );
    }

    throw error;
  }

  if (pending === undefined || wait === undefined) {
    return [200, answer];
  }

  const notification = await within(pending.received, wait.timeoutMs);

  if (notification === undefined) {
    pending.cancel();

    return [
      504,
      {
        ...answer,
        error: {
          message: `${wait.waitFor} was not received within ${seconds(wait.timeoutMs)}`,
        },
      },
    ];
  }

  return [200, { ...answer, notification }];
}

async function send(
  session: ControlledSession,
  { method, params, ...rest }: { method: string; params?: unknown },
  requestTimeoutMs: number
): Promise<Record<string, unknown>> {
  if (!("id" in rest)) {
    await session.notify(method, params);

    return { ok: true };
  }

  const result = await within(
    session.request(method, params),
    requestTimeoutMs,
    true
  );

  return { result: result ?? null };
}

async function syncFiles(
  session: ControlledSession,
  body: unknown,
  wait: Wait | undefined
): Promise<Answer> {
  const files = (body as { files?: unknown })?.files;

  if (
    !Array.isArray(files) ||
    files.length === 0 ||
    !files.every((file) => typeof file === "string")
  ) {
    return fault(400, "Expected { files: [<path>, ...] }");
  }

  // Check every file first, so a bad path sends nothing at all rather than
  // syncing the files before it.
  const unreadable = files.filter((file) => !session.canRead(file));

  if (unreadable.length > 0) {
    return fault(400, `Cannot read: ${unreadable.join(", ")}`);
  }

  // Listen for every file before syncing any, then keep only the waits for
  // files something was sent for: an unchanged file will not be validated.
  const pending = files.map(
    (file) => wait && session.waitFor(wait.waitFor, session.uriFor(file))
  );

  const results: Array<SyncResult & { notification?: ServerNotification }> = [];

  for (const file of files) {
    results.push(await session.syncFromDisk(file));
  }

  if (wait === undefined) {
    return [200, { results }];
  }

  const missing: string[] = [];

  for (const [index, result] of results.entries()) {
    const waiting = pending[index]!;

    if (result.sent === null) {
      waiting.cancel();
      continue;
    }

    const notification = await within(waiting.received, wait.timeoutMs);

    if (notification === undefined) {
      waiting.cancel();
      missing.push(files[index]);
    } else {
      result.notification = notification;
    }
  }

  if (missing.length > 0) {
    return [
      504,
      {
        results,
        error: {
          message: `${wait.waitFor} was not received within ${seconds(wait.timeoutMs)} for: ${missing.join(", ")}`,
        },
      },
    ];
  }

  return [200, { results }];
}

function diagnostics(
  session: ControlledSession,
  query: URLSearchParams
): Answer {
  const file = query.get("file");
  const uri = query.get("uri") ?? (file === null ? null : session.uriFor(file));

  if (uri === null) {
    return [200, { diagnostics: Object.fromEntries(session.diagnostics) }];
  }

  // null, not [], when the server has published nothing for the document.
  return [200, { uri, diagnostics: session.diagnostics.get(uri) ?? null }];
}

function notifications(
  session: ControlledSession,
  query: URLSearchParams
): Answer {
  const since = Number(query.get("since") ?? 0);

  if (!Number.isInteger(since) || since < 0) {
    return fault(400, "since must be a notification number");
  }

  return [
    200,
    { ...session.notifications(since, query.get("method") ?? undefined) },
  ];
}

function fault(status: number, message: string): Answer {
  return [status, { error: { message } }];
}

class Timeout extends Error {}

/**
 * The promise's value, or undefined if it takes longer than `ms`. With
 * `throwOnTimeout`, a timeout throws a `Timeout` instead.
 */
async function within<T>(
  promise: Promise<T>,
  ms: number,
  throwOnTimeout = false
): Promise<T | undefined> {
  const timedOut = Symbol("timed out");

  const value = await Promise.race([
    promise,
    new Promise<typeof timedOut>((resolve) =>
      setTimeout(() => resolve(timedOut), ms).unref()
    ),
  ]);

  if (value === timedOut) {
    if (throwOnTimeout) {
      throw new Timeout();
    }

    return undefined;
  }

  return value;
}

function seconds(ms: number): string {
  return `${ms / 1000}s`;
}

function isMessage(
  body: unknown
): body is { method: string; params?: unknown; id?: unknown } {
  return (
    typeof body === "object" &&
    body !== null &&
    typeof (body as { method?: unknown }).method === "string"
  );
}

function readBody(request: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";

    request.setEncoding("utf8");
    request.on("data", (chunk: string) => {
      body += chunk;
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

/** An answer from the running daemon's control endpoint. */
export interface ControlAnswer {
  status: number;
  body: unknown;
}

/**
 * Call the running daemon's control endpoint. Throws when no daemon is
 * running, since there is nothing to call.
 */
export async function callDaemon(
  route: string,
  body?: unknown
): Promise<ControlAnswer> {
  const state = readDaemonState();

  if (state === undefined || runningDaemonPid() !== state.pid) {
    throw new Error(
      "No daemon running. Start one with `start --workspace <name>`."
    );
  }

  const response = await fetch(`http://${CONTROL_HOST}:${state.port}${route}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  return { status: response.status, body: await response.json() };
}
