import http from "node:http";
import { ResponseError } from "vscode-jsonrpc/node";
import type { SyncResult } from "./lsp.ts";
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
}

export interface ControlOptions {
  /** How long a forwarded request may take before the route gives up. */
  requestTimeoutMs?: number;
}

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
 *
 * HTTP status codes are for the harness's own faults: 400 for a malformed
 * body, 503 before the daemon is ready, 502 when the server has gone, 504
 * when a request times out. An error the server answers with is a 200.
 */
export function createControlServer(
  state: () => DaemonState,
  session: ControlledSession,
  { requestTimeoutMs = 30_000 }: ControlOptions = {}
): http.Server {
  return http.createServer(async (request, response) => {
    const reply = (status: number, body: unknown) => {
      response.writeHead(status, { "content-type": "application/json" });
      response.end(JSON.stringify(body));
    };

    const route = `${request.method} ${request.url}`;

    if (route === "GET /ping") {
      return reply(200, state());
    }

    if (route !== "POST /message" && route !== "POST /sync-from-disk") {
      return reply(404, { error: { message: `No route ${route}` } });
    }

    if (!state().ready) {
      return reply(503, { error: { message: "The daemon is not ready yet" } });
    }

    let body: unknown;

    try {
      body = JSON.parse(await readBody(request));
    } catch {
      return reply(400, { error: { message: "The body is not JSON" } });
    }

    try {
      if (route === "POST /message") {
        const [status, answer] = await forwardMessage(
          session,
          body,
          requestTimeoutMs
        );

        return reply(status, answer);
      }

      const [status, answer] = await syncFiles(session, body);

      return reply(status, answer);
    } catch (error) {
      return reply(502, {
        error: { message: error instanceof Error ? error.message : `${error}` },
      });
    }
  });
}

async function forwardMessage(
  session: ControlledSession,
  body: unknown,
  requestTimeoutMs: number
): Promise<[number, unknown]> {
  if (!isMessage(body)) {
    return [400, { error: { message: "A message needs a string `method`" } }];
  }

  const { method, params } = body;

  if (!("id" in body)) {
    await session.notify(method, params);

    return [200, { ok: true }];
  }

  const timedOut = Symbol("timed out");

  try {
    const result = await Promise.race([
      session.request(method, params),
      new Promise<typeof timedOut>((resolve) =>
        setTimeout(() => resolve(timedOut), requestTimeoutMs).unref()
      ),
    ]);

    if (result === timedOut) {
      return [
        504,
        {
          error: {
            message: `${method} was not answered within ${requestTimeoutMs / 1000}s`,
          },
        },
      ];
    }

    return [200, { result: result ?? null }];
  } catch (error) {
    if (error instanceof ResponseError) {
      return [
        200,
        {
          error: { code: error.code, message: error.message, data: error.data },
        },
      ];
    }

    throw error;
  }
}

async function syncFiles(
  session: ControlledSession,
  body: unknown
): Promise<[number, unknown]> {
  const files = (body as { files?: unknown })?.files;

  if (
    !Array.isArray(files) ||
    files.length === 0 ||
    !files.every((file) => typeof file === "string")
  ) {
    return [400, { error: { message: "Expected { files: [<path>, ...] }" } }];
  }

  // Check every file first, so a bad path sends nothing at all rather than
  // syncing the files before it.
  const unreadable = files.filter((file) => !session.canRead(file));

  if (unreadable.length > 0) {
    return [
      400,
      { error: { message: `Cannot read: ${unreadable.join(", ")}` } },
    ];
  }

  const results: SyncResult[] = [];

  for (const file of files) {
    results.push(await session.syncFromDisk(file));
  }

  return [200, { results }];
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
