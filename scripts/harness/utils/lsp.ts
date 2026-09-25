import { type ChildProcess, fork } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  createMessageConnection,
  IPCMessageReader,
  IPCMessageWriter,
  type MessageConnection,
} from "vscode-jsonrpc/node";
import { ROOT_DIR } from "./paths.ts";
import type { Workspace } from "./workspaces.ts";

/** The tsc build, which is what the protocol suite runs too. */
export const SERVER_MODULE = path.join(ROOT_DIR, "server", "out", "index.js");

/**
 * The protocol suite's initialize params, so the harness and the suite start
 * the server the same way: telemetry off and an empty extension config. The
 * server takes its settings only from here and from
 * `custom/didChangeExtensionConfig`; it never asks the client for them.
 */
const INITIALIZE_PARAMS = path.join(
  ROOT_DIR,
  "test",
  "protocol",
  "src",
  "initializeParams.json"
);

/** How long to wait for the burst of `custom/file-indexed` to stop. */
const INDEXING_QUIET_MS = 1_000;

/** How long one file's first validation may take, compiler download included. */
const VALIDATION_TIMEOUT_MS = 180_000;

interface IndexedFile {
  /** Despite the name, a file system path: the server's index key. */
  uri: string;
  project: { configPath?: string; frameworkName: string };
}

type Log = (message: string) => void;

/**
 * One language server, started against one workspace over Node IPC — the
 * transport the extension uses.
 */
export class LanguageServerSession {
  readonly #workspace: Workspace;
  readonly #log: Log;
  readonly #server: ChildProcess;
  readonly #connection: MessageConnection;

  readonly #indexed: IndexedFile[] = [];
  #lastIndexedAt = 0;
  readonly #validated = new Map<string, () => void>();

  /** The latest diagnostics the server has published, by document URI. */
  readonly diagnostics = new Map<string, unknown[]>();

  /** Resolves with the exit code when the server process ends. */
  readonly exited: Promise<number | null>;

  constructor(workspace: Workspace, log: Log) {
    if (!fs.existsSync(SERVER_MODULE)) {
      throw new Error(
        `No language server build at ${path.relative(ROOT_DIR, SERVER_MODULE)}. Run \`pnpm build\` first.`
      );
    }

    this.#workspace = workspace;
    this.#log = log;

    this.#server = fork(SERVER_MODULE, ["--node-ipc"], {
      cwd: workspace.dir,
      // Test mode is what makes the server send custom/validated and
      // custom/projectInitialized, which readiness waits on. It also drops
      // the change debounce and skips fetching the solc version list.
      env: { ...process.env, VSCODE_NODE_ENV: "development" },
      stdio: ["ignore", "pipe", "pipe", "ipc"],
    });

    this.exited = new Promise((resolve) =>
      this.#server.once("exit", (code) => resolve(code))
    );

    for (const stream of [this.#server.stdout, this.#server.stderr]) {
      stream?.setEncoding("utf8");
      stream?.on("data", (chunk: string) => {
        for (const line of chunk.trimEnd().split("\n")) {
          this.#log(`server | ${line}`);
        }
      });
    }

    this.#connection = createMessageConnection(
      new IPCMessageReader(this.#server),
      new IPCMessageWriter(this.#server)
    );

    this.#connection.onNotification(
      "window/logMessage",
      ({ message }: { message: string }) => this.#log(`server > ${message}`)
    );

    this.#connection.onNotification(
      "custom/file-indexed",
      (file: IndexedFile) => {
        this.#indexed.push(file);
        this.#lastIndexedAt = Date.now();
      }
    );

    this.#connection.onNotification(
      "textDocument/publishDiagnostics",
      ({ uri, diagnostics }: { uri: string; diagnostics: unknown[] }) => {
        this.diagnostics.set(uri, diagnostics);
      }
    );

    this.#connection.onNotification(
      "custom/validated",
      ({ uri }: { uri: string }) => {
        this.#validated.get(uri)?.();
        this.#validated.delete(uri);
      }
    );

    this.#connection.listen();
  }

  get pid(): number | undefined {
    return this.#server.pid;
  }

  /**
   * Initialize the server against the workspace and wait until it is ready
   * to answer about any file in it.
   *
   * The server indexes the workspace and initializes every project inside
   * `initialize`, so its response already means "indexed". What it does not
   * prove is that each project can compile, so one file per project is then
   * opened and waited on until it has been validated.
   */
  async initialize(): Promise<void> {
    const base = JSON.parse(fs.readFileSync(INITIALIZE_PARAMS, "utf8"));
    const rootUri = pathToFileURL(this.#workspace.dir).href;

    this.#log("initializing");

    await this.#connection.sendRequest("initialize", {
      ...base,
      processId: process.pid,
      rootUri,
      workspaceFolders: [{ name: this.#workspace.name, uri: rootUri }],
    });

    await this.#connection.sendNotification("initialized", {});

    await this.#waitForIndexingToSettle();

    const probes = probeFiles(this.#indexed);

    this.#log(
      `indexed ${this.#indexed.length} files in ${probes.length} project(s)`
    );

    for (const file of probes) {
      await this.#validate(file);
    }
  }

  /** Ask the server to shut down, and kill it if it does not. */
  async shutdown(timeoutMs = 5_000): Promise<void> {
    if (this.#server.exitCode !== null) {
      return;
    }

    const exited = this.exited.then(() => true);
    const timedOut = sleep(timeoutMs).then(() => false);

    try {
      await Promise.race([this.#connection.sendRequest("shutdown"), timedOut]);
      await this.#connection.sendNotification("exit");
    } catch {
      // The connection may already be gone; the kill below covers it.
    }

    if (!(await Promise.race([exited, timedOut]))) {
      this.#server.kill("SIGKILL");
      await this.exited;
    }

    this.#connection.dispose();
  }

  async #waitForIndexingToSettle(): Promise<void> {
    const start = Date.now();

    // file-indexed is sent after `initialized`, one per file, so wait until
    // none has arrived for a while. A workspace with no Solidity files sends
    // none at all.
    while (true) {
      const since = Date.now() - Math.max(this.#lastIndexedAt, start);

      if (since >= INDEXING_QUIET_MS) {
        return;
      }

      await sleep(INDEXING_QUIET_MS - since);
    }
  }

  async #validate(absolutePath: string): Promise<void> {
    const uri = pathToFileURL(absolutePath).href;
    const file = path.relative(this.#workspace.dir, absolutePath);
    const text = fs.readFileSync(absolutePath, "utf8");

    this.#log(`validating ${file}`);

    const validated = new Promise<void>((resolve) =>
      this.#validated.set(uri, resolve)
    );

    await this.#connection.sendNotification("textDocument/didOpen", {
      textDocument: { uri, languageId: "solidity", version: 1, text },
    });

    const inTime = await Promise.race([
      validated.then(() => true),
      sleep(VALIDATION_TIMEOUT_MS).then(() => false),
    ]);

    await this.#connection.sendNotification("textDocument/didClose", {
      textDocument: { uri },
    });

    if (!inTime) {
      throw new Error(
        `${file} was not validated within ${VALIDATION_TIMEOUT_MS / 1000}s`
      );
    }

    this.#log(
      `validated ${file}: ${this.diagnostics.get(uri)?.length ?? 0} diagnostic(s)`
    );
  }
}

/**
 * One file per project to validate before the workspace counts as ready,
 * returned as paths. The project's own sources come first, then dependencies
 * under `lib/` or `node_modules/`, and within each the first by path. Files
 * outside any project are left out: they have no compiler setup to prove.
 */
export function probeFiles(indexed: IndexedFile[]): string[] {
  const byProject = new Map<string, string>();

  for (const { uri, project } of indexed) {
    if (project.configPath === undefined) {
      continue;
    }

    const current = byProject.get(project.configPath);

    if (current === undefined || probeOrder(uri, current) < 0) {
      byProject.set(project.configPath, uri);
    }
  }

  return [...byProject.keys()].sort().map((key) => byProject.get(key)!);
}

function probeOrder(a: string, b: string): number {
  const dependency = (file: string) =>
    /[\\/](lib|node_modules)[\\/]/.test(file) ? 1 : 0;

  return dependency(a) - dependency(b) || (a < b ? -1 : a > b ? 1 : 0);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms).unref());
}
