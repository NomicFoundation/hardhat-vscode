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

export interface SessionOptions {
  /** The server to fork. Tests point this at the fake server. */
  serverModule?: string;
  /** Extra environment for the server, over this process's own. */
  env?: Record<string, string>;
  /** How long to wait for the burst of `custom/file-indexed` to stop. */
  indexingQuietMs?: number;
  /** How long one file's first validation may take, compiler download included. */
  validationTimeoutMs?: number;
}

export interface IndexedFile {
  /** Despite the name, a file system path: the server's index key. */
  uri: string;
  project: { configPath?: string; frameworkName: string };
}

/** What `syncFromDisk` sent for one file. */
export interface SyncResult {
  uri: string;
  /** The notification sent, or null when the server already had this text. */
  sent: "textDocument/didOpen" | "textDocument/didChange" | null;
  version: number;
}

/**
 * A document the server has open, as far as this client has told it. `text`
 * is undefined once an incremental change has gone through the pipe
 * unapplied, which makes the next sync send the whole text again.
 */
interface OpenDocument {
  version: number;
  text: string | undefined;
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
  readonly #indexingQuietMs: number;
  readonly #validationTimeoutMs: number;

  readonly #indexed: IndexedFile[] = [];
  #lastIndexedAt = 0;
  readonly #validated = new Map<string, () => void>();
  readonly #open = new Map<string, OpenDocument>();

  /** The latest diagnostics the server has published, by document URI. */
  readonly diagnostics = new Map<string, unknown[]>();

  /** Resolves with the exit code when the server process ends. */
  readonly exited: Promise<number | null>;

  constructor(workspace: Workspace, log: Log, options: SessionOptions = {}) {
    const serverModule = options.serverModule ?? SERVER_MODULE;

    if (!fs.existsSync(serverModule)) {
      throw new Error(
        `No language server build at ${path.relative(ROOT_DIR, serverModule)}. Run \`pnpm build\` first.`
      );
    }

    this.#workspace = workspace;
    this.#log = log;
    this.#indexingQuietMs = options.indexingQuietMs ?? 1_000;
    this.#validationTimeoutMs = options.validationTimeoutMs ?? 180_000;

    this.#server = fork(serverModule, ["--node-ipc"], {
      cwd: workspace.dir,
      // Test mode is what makes the server send custom/validated and
      // custom/projectInitialized, which readiness waits on. It also drops
      // the change debounce and skips fetching the solc version list.
      env: {
        ...process.env,
        VSCODE_NODE_ENV: "development",
        ...options.env,
      },
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

    await this.#untilExit(
      this.#connection.sendRequest("initialize", {
        ...base,
        processId: process.pid,
        rootUri,
        workspaceFolders: [{ name: this.#workspace.name, uri: rootUri }],
      })
    );

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

  /** Send a request as given, and resolve with the server's result. */
  request(method: string, params?: unknown): Promise<unknown> {
    return this.#untilExit(
      params === undefined
        ? this.#connection.sendRequest(method)
        : this.#connection.sendRequest(method, params)
    );
  }

  /**
   * Send a notification as given. Document notifications are also recorded,
   * so a later `syncFromDisk` knows what the server has open.
   */
  async notify(method: string, params?: unknown): Promise<void> {
    this.#track(method, params);

    await (params === undefined
      ? this.#connection.sendNotification(method)
      : this.#connection.sendNotification(method, params));
  }

  /** A path, relative to the workspace or absolute, as `syncFromDisk` takes it. */
  resolve(file: string): string {
    return path.resolve(this.#workspace.dir, file);
  }

  /** True if `syncFromDisk` could read the file. */
  canRead(file: string): boolean {
    try {
      return fs.statSync(this.resolve(file)).isFile();
    } catch {
      return false;
    }
  }

  /**
   * Bring the server's copy of a file up to date with the disk, and send
   * nothing else: `didOpen` if the server does not have it open, a full-text
   * `didChange` if it has other text, or nothing if it is already current.
   */
  async syncFromDisk(file: string): Promise<SyncResult> {
    const absolutePath = this.resolve(file);
    const uri = pathToFileURL(absolutePath).href;

    let text: string;

    try {
      text = fs.readFileSync(absolutePath, "utf8");
    } catch {
      throw new Error(`Cannot read ${absolutePath}`);
    }

    const open = this.#open.get(uri);

    if (open === undefined) {
      await this.notify("textDocument/didOpen", {
        textDocument: { uri, languageId: "solidity", version: 1, text },
      });

      return { uri, sent: "textDocument/didOpen", version: 1 };
    }

    if (open.text === text) {
      return { uri, sent: null, version: open.version };
    }

    const version = open.version + 1;

    await this.notify("textDocument/didChange", {
      textDocument: { uri, version },
      contentChanges: [{ text }],
    });

    return { uri, sent: "textDocument/didChange", version };
  }

  /** Ask the server to shut down, and kill it if it does not. */
  async shutdown(timeoutMs = 5_000): Promise<void> {
    if (this.#server.exitCode !== null || this.#server.signalCode !== null) {
      this.#connection.dispose();

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

  #track(method: string, params: unknown): void {
    const { textDocument, contentChanges } = (params ?? {}) as {
      textDocument?: { uri?: string; version?: number; text?: string };
      contentChanges?: Array<{ range?: unknown; text?: string }>;
    };

    if (textDocument?.uri === undefined) {
      return;
    }

    const { uri } = textDocument;

    switch (method) {
      case "textDocument/didOpen":
        this.#open.set(uri, {
          version: textDocument.version ?? 1,
          text: textDocument.text,
        });
        break;
      case "textDocument/didChange": {
        const open = this.#open.get(uri);
        const last = contentChanges?.at(-1);

        // Only a trailing whole-text change says what the text now is.
        // Incremental ranges are passed through but not applied here.
        this.#open.set(uri, {
          version: textDocument.version ?? (open?.version ?? 0) + 1,
          text:
            last !== undefined && last.range === undefined
              ? last.text
              : undefined,
        });
        break;
      }
      case "textDocument/didClose":
        this.#open.delete(uri);
        break;
    }
  }

  /** Reject if the server exits before the promise settles. */
  #untilExit<T>(promise: Promise<T>): Promise<T> {
    return Promise.race([
      promise,
      this.exited.then((code) => {
        throw new Error(`The language server exited (code ${code})`);
      }),
    ]);
  }

  async #waitForIndexingToSettle(): Promise<void> {
    const start = Date.now();

    // file-indexed is sent after `initialized`, one per file, so wait until
    // none has arrived for a while. A workspace with no Solidity files sends
    // none at all.
    while (true) {
      const since = Date.now() - Math.max(this.#lastIndexedAt, start);

      if (since >= this.#indexingQuietMs) {
        return;
      }

      await this.#untilExit(sleep(this.#indexingQuietMs - since));
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

    await this.notify("textDocument/didOpen", {
      textDocument: { uri, languageId: "solidity", version: 1, text },
    });

    const inTime = await this.#untilExit(
      Promise.race([
        validated.then(() => true),
        sleep(this.#validationTimeoutMs).then(() => false),
      ])
    );

    await this.notify("textDocument/didClose", { textDocument: { uri } });

    if (!inTime) {
      throw new Error(
        `${file} was not validated within ${this.#validationTimeoutMs / 1000}s`
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
