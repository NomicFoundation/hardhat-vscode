import { callDaemon } from "../utils/control.ts";

export interface LspMessageOptions {
  message?: string;
  syncFromDisk: boolean;
  files: string[];
}

/**
 * Send to the running daemon's server, in one of two modes, and print the
 * answer as JSON:
 *
 * - `--message <json>` passes one JSON-RPC message through as given. With an
 *   `id` it is a request, and the result or the server's error is printed;
 *   without, a notification.
 * - `--sync-from-disk --file <path>...` brings the server's copy of each file
 *   up to date with the disk, sending only didOpen or didChange, and prints
 *   what was sent. Paths are relative to the daemon's workspace.
 *
 * Exits 1 when the server answers with an error, or the harness fails.
 */
export async function lspMessage(options: LspMessageOptions): Promise<void> {
  const { route, body } = lspMessageRequest(options);

  const answer = await callDaemon(route, body);

  console.log(JSON.stringify(answer.body, null, 2));

  if (answer.status !== 200 || hasError(answer.body)) {
    process.exitCode = 1;
  }
}

/** The route and body for the options, or an error explaining the misuse. */
export function lspMessageRequest({
  message,
  syncFromDisk,
  files,
}: LspMessageOptions): { route: string; body: unknown } {
  if (syncFromDisk) {
    if (message !== undefined) {
      throw new Error(
        "--sync-from-disk sends only didOpen or didChange, so it takes no --message"
      );
    }

    if (files.length === 0) {
      throw new Error("--sync-from-disk needs at least one --file <path>");
    }

    return { route: "/sync-from-disk", body: { files } };
  }

  if (files.length > 0) {
    throw new Error("--file is only used with --sync-from-disk");
  }

  if (message === undefined) {
    throw new Error("lsp-message needs --message <json> or --sync-from-disk");
  }

  let body: unknown;

  try {
    body = JSON.parse(message);
  } catch {
    throw new Error("--message is not valid JSON");
  }

  return { route: "/message", body };
}

function hasError(body: unknown): boolean {
  return typeof body === "object" && body !== null && "error" in body;
}
