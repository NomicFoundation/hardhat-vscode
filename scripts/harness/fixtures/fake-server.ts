/**
 * A stand-in for the language server, for the harness's own tests. It speaks
 * LSP over Node IPC like the real one, and does just enough to drive the
 * harness through readiness, shutdown and the ways each can fail.
 *
 * Configured through the environment, since the harness forks it with fixed
 * arguments:
 *
 *   FAKE_SERVER_SCENARIO  ready (the default), slow-burst, never-validates,
 *                         crash-on-initialize, crash-on-open or
 *                         ignores-shutdown
 *   FAKE_SERVER_FILES     JSON array of the custom/file-indexed payloads to
 *                         send after `initialized`
 *
 * Every message it receives is recorded, and the `fake/received` request
 * returns them, so a test can assert what the harness sent and in what order.
 * `fake/echo` returns its params, and `fake/fail` answers with an error.
 */
import {
  createMessageConnection,
  IPCMessageReader,
  IPCMessageWriter,
  ResponseError,
} from "vscode-jsonrpc/node";

const scenario = process.env.FAKE_SERVER_SCENARIO ?? "ready";

const files: unknown[] = JSON.parse(process.env.FAKE_SERVER_FILES ?? "[]");

const received: Array<{ method: string; params: unknown }> = [];

const connection = createMessageConnection(
  new IPCMessageReader(process),
  new IPCMessageWriter(process)
);

connection.onRequest(async (method, params) => {
  switch (method) {
    case "fake/received":
      return received;
    case "fake/echo":
      return params;
  }

  received.push({ method, params });

  switch (method) {
    case "initialize":
      if (scenario === "crash-on-initialize") {
        process.exit(3);
      }

      return { capabilities: {} };
    case "shutdown":
      if (scenario === "ignores-shutdown") {
        return new Promise(() => {});
      }

      return null;
    case "fake/fail":
      throw new ResponseError(-32099, "fake failure", { detail: "from fake" });
    default:
      return null;
  }
});

connection.onNotification(async (method, params) => {
  received.push({ method, params });

  switch (method) {
    case "initialized":
      for (const file of files) {
        if (scenario === "slow-burst") {
          await sleep(100);
        }

        await connection.sendNotification("custom/file-indexed", file);
      }
      break;
    case "textDocument/didOpen": {
      if (scenario === "crash-on-open") {
        process.exit(4);
      }

      if (scenario === "never-validates") {
        break;
      }

      const { uri } = (params as { textDocument: { uri: string } })
        .textDocument;

      await connection.sendNotification("textDocument/publishDiagnostics", {
        uri,
        diagnostics: [{ message: "fake diagnostic" }],
      });
      await connection.sendNotification("custom/validated", { uri });
      break;
    }
    case "exit":
      process.exit(0);
  }
});

connection.listen();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
