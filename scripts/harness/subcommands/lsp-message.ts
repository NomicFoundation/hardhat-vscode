import path from "node:path";
import { pathToFileURL } from "node:url";
import { callDaemon } from "../utils/control.ts";
import { readDaemonState } from "../utils/state.ts";
import { resolveWorkspace } from "../utils/workspaces.ts";

export interface LspMessageOptions {
  message?: string;
  method?: string;
  params?: string;
  notification: boolean;
  syncFromDisk: boolean;
  files: string[];
  line?: string;
  character?: string;
  waitFor?: string;
  waitTimeout?: string;
}

/**
 * Send to the running daemon's server, in one of three modes, and print the
 * answer as JSON. Exits 1 when the server answers with an error, or the
 * harness fails.
 */
export async function lspMessage(options: LspMessageOptions): Promise<void> {
  const { route, body } = lspMessageRequest(options, daemonUriFor());

  await printAnswer(route, body);
}

/** Print the latest diagnostics for one file, or for every document. */
export async function diagnostics(file: string | undefined): Promise<void> {
  const query = file === undefined ? "" : `?${new URLSearchParams({ file })}`;

  await printAnswer(`/diagnostics${query}`);
}

/** Print what the server has sent after notification `since`. */
export async function notifications(
  since: string | undefined,
  method: string | undefined
): Promise<void> {
  const query = new URLSearchParams();

  if (since !== undefined) {
    query.set("since", since);
  }

  if (method !== undefined) {
    query.set("method", method);
  }

  await printAnswer(`/notifications${query.size > 0 ? `?${query}` : ""}`);
}

/**
 * The route and body for the options, or an error explaining the misuse.
 *
 * - `--message <json>` passes one JSON-RPC message through as given: a
 *   request if it has an `id`, else a notification.
 * - `--method <m>` builds one. `--file` fills `textDocument`, and `--line`
 *   with `--character` fill `position`. Both count from 1, as editors and
 *   `grep -n` do, and are sent 0-based as LSP wants; what the server returns
 *   is printed as it is, 0-based. `--params <json>` is merged over the built
 *   params. It is a request unless `--notification` is given.
 * - `--sync-from-disk --file <path>...` sends only didOpen or didChange.
 *
 * `--wait-for <method>` works with all three: the answer waits for that
 * notification about the same document.
 */
export function lspMessageRequest(
  options: LspMessageOptions,
  uriFor: (file: string) => string
): { route: string; body: unknown } {
  const { message, method, syncFromDisk, files } = options;
  const modes = [message !== undefined, method !== undefined, syncFromDisk];

  if (modes.filter(Boolean).length !== 1) {
    throw new Error(
      "lsp-message needs exactly one of --message <json>, --method <method> or --sync-from-disk"
    );
  }

  const query = waitQuery(options);

  if (syncFromDisk) {
    rejectOptions(options, "--sync-from-disk", [
      "params",
      "notification",
      "line",
      "character",
    ]);

    if (files.length === 0) {
      throw new Error("--sync-from-disk needs at least one --file <path>");
    }

    return { route: `/sync-from-disk${query}`, body: { files } };
  }

  if (message !== undefined) {
    rejectOptions(options, "--message", [
      "params",
      "notification",
      "line",
      "character",
    ]);

    if (files.length > 0) {
      throw new Error("--message takes no --file; the message names its own");
    }

    return { route: `/message${query}`, body: parseJson(message, "--message") };
  }

  return { route: `/message${query}`, body: buildMessage(options, uriFor) };
}

function buildMessage(
  options: LspMessageOptions,
  uriFor: (file: string) => string
): unknown {
  const { method, files, line, character, notification } = options;

  if (files.length > 1) {
    throw new Error("--method takes at most one --file");
  }

  const [file] = files;
  const params: Record<string, unknown> = {};

  if (file !== undefined) {
    params.textDocument = { uri: uriFor(file) };
  }

  if ((line === undefined) !== (character === undefined)) {
    throw new Error("--line and --character go together");
  }

  if (line !== undefined && character !== undefined) {
    if (file === undefined) {
      throw new Error("--line and --character need a --file");
    }

    params.position = {
      line: countingFromOne(line, "--line") - 1,
      character: countingFromOne(character, "--character") - 1,
    };
  }

  if (options.params !== undefined) {
    const extra = parseJson(options.params, "--params");

    if (typeof extra !== "object" || extra === null || Array.isArray(extra)) {
      throw new Error("--params must be a JSON object");
    }

    Object.assign(params, extra);
  }

  const body: Record<string, unknown> = { method };

  if (Object.keys(params).length > 0) {
    body.params = params;
  }

  if (!notification) {
    body.id = 1;
  }

  return body;
}

function waitQuery({ waitFor, waitTimeout }: LspMessageOptions): string {
  if (waitFor === undefined) {
    if (waitTimeout !== undefined) {
      throw new Error("--wait-timeout is only used with --wait-for");
    }

    return "";
  }

  const query = new URLSearchParams({ waitFor });

  if (waitTimeout !== undefined) {
    query.set(
      "waitTimeoutMs",
      String(countingFromOne(waitTimeout, "--wait-timeout"))
    );
  }

  return `?${query}`;
}

function rejectOptions(
  options: LspMessageOptions,
  mode: string,
  names: Array<"params" | "notification" | "line" | "character">
): void {
  for (const name of names) {
    const value = options[name];

    if (value !== undefined && value !== false) {
      throw new Error(`${mode} takes no --${name}`);
    }
  }
}

function countingFromOne(value: string, flag: string): number {
  const number = Number(value);

  if (!Number.isInteger(number) || number < 1) {
    throw new Error(`${flag} must be a whole number from 1`);
  }

  return number;
}

function parseJson(value: string, flag: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`${flag} is not valid JSON`);
  }
}

/** Resolve --file against the running daemon's workspace. */
function daemonUriFor(): (file: string) => string {
  return (file) => {
    const state = readDaemonState();

    if (state === undefined) {
      throw new Error(
        "No daemon running. Start one with `start --workspace <name>`."
      );
    }

    const { dir } = resolveWorkspace(state.workspace);

    return pathToFileURL(path.resolve(dir, file)).href;
  };
}

async function printAnswer(route: string, body?: unknown): Promise<void> {
  const answer = await callDaemon(route, body);

  console.log(JSON.stringify(answer.body, null, 2));

  if (answer.status !== 200 || hasError(answer.body)) {
    process.exitCode = 1;
  }
}

function hasError(body: unknown): boolean {
  return typeof body === "object" && body !== null && "error" in body;
}
