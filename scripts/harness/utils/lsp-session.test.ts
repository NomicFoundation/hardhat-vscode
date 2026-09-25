import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, it } from "node:test";
import { pathToFileURL } from "node:url";
import { ResponseError } from "vscode-jsonrpc/node";
import { isAlive } from "./daemon.ts";
import { LanguageServerSession, type SessionOptions } from "./lsp.ts";
import type { Workspace } from "./workspaces.ts";

const FAKE_SERVER = path.join(
  import.meta.dirname,
  "..",
  "fixtures",
  "fake-server.ts"
);

interface Received {
  method: string;
  params: any;
}

/**
 * A scratch workspace with two projects — a Hardhat one at the root and a
 * Foundry one under sub/ — plus a dependency and a file in no project. The
 * fake server announces them in `order`.
 */
function fakeWorkspace() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "harness-session-"));
  const hardhat = {
    configPath: path.join(dir, "hardhat.config.ts"),
    frameworkName: "Hardhat",
  };
  const foundry = {
    configPath: path.join(dir, "sub", "foundry.toml"),
    frameworkName: "Foundry",
  };

  const files = {
    greeter: "contracts/Greeter.sol",
    dependency: "lib/dep/Dep.sol",
    counter: "sub/src/Counter.sol",
    loose: "loose/Loose.sol",
    // Sorts first among the Hardhat project's own sources, and is announced
    // last, so probing it proves the whole burst was waited for.
    first: "contracts/Aaa.sol",
  };

  for (const file of Object.values(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), `// ${file}\n`);
  }

  const indexed = [
    { uri: path.join(dir, files.greeter), project: hardhat },
    { uri: path.join(dir, files.dependency), project: hardhat },
    { uri: path.join(dir, files.counter), project: foundry },
    { uri: path.join(dir, files.loose), project: { frameworkName: "None" } },
    { uri: path.join(dir, files.first), project: hardhat },
  ];

  const workspace = {
    name: "hardhat3",
    framework: "hardhat",
    dir,
  } as Workspace;
  const uri = (file: string) => pathToFileURL(path.join(dir, file)).href;

  return { dir, files, indexed, workspace, uri };
}

const sessions: LanguageServerSession[] = [];

afterEach(async () => {
  await Promise.all(sessions.splice(0).map((session) => session.shutdown(500)));
});

function startSession(
  scenario: string,
  fixture = fakeWorkspace(),
  options: SessionOptions = {}
) {
  const log: string[] = [];
  const session = new LanguageServerSession(
    fixture.workspace,
    (line) => log.push(line),
    {
      serverModule: FAKE_SERVER,
      env: {
        FAKE_SERVER_SCENARIO: scenario,
        FAKE_SERVER_FILES: JSON.stringify(fixture.indexed),
      },
      indexingQuietMs: 300,
      validationTimeoutMs: 5_000,
      ...options,
    }
  );

  sessions.push(session);

  return { session, log, ...fixture };
}

async function received(session: LanguageServerSession): Promise<Received[]> {
  return (await session.request("fake/received")) as Received[];
}

function summary(messages: Received[]): string[] {
  return messages.map(({ method, params }) =>
    params?.textDocument?.uri === undefined
      ? method
      : `${method} ${params.textDocument.uri}`
  );
}

describe("LanguageServerSession.initialize", () => {
  it("initializes, then opens and closes one file per project", async () => {
    const { session, uri, files, dir } = startSession("ready");

    await session.initialize();

    const messages = await received(session);

    assert.deepEqual(summary(messages), [
      "initialize",
      "initialized",
      `textDocument/didOpen ${uri(files.first)}`,
      `textDocument/didClose ${uri(files.first)}`,
      `textDocument/didOpen ${uri(files.counter)}`,
      `textDocument/didClose ${uri(files.counter)}`,
    ]);

    const [initialize] = messages;
    assert.deepEqual(initialize.params.workspaceFolders, [
      { name: "hardhat3", uri: pathToFileURL(dir).href },
    ]);
    assert.equal(initialize.params.processId, process.pid);
  });

  it("records the diagnostics the server publishes", async () => {
    const { session, uri, files } = startSession("ready");

    await session.initialize();

    assert.deepEqual(session.diagnostics.get(uri(files.first)), [
      { message: "fake diagnostic" },
    ]);
  });

  it("waits for a slow burst of file-indexed to finish", async () => {
    // The files arrive 100ms apart, inside the 300ms quiet period, and the
    // file that should be probed arrives last.
    const { session, uri, files } = startSession("slow-burst");

    await session.initialize();

    const opened = summary(await received(session)).filter((line) =>
      line.startsWith("textDocument/didOpen")
    );

    assert.deepEqual(opened, [
      `textDocument/didOpen ${uri(files.first)}`,
      `textDocument/didOpen ${uri(files.counter)}`,
    ]);
  });

  it("fails when a probe file is never validated", async () => {
    const { session } = startSession("never-validates", undefined, {
      validationTimeoutMs: 200,
    });

    await assert.rejects(
      session.initialize(),
      /contracts\/Aaa\.sol was not validated within 0\.2s/
    );
  });

  it("fails at once when the server exits during initialize", async () => {
    const { session } = startSession("crash-on-initialize");

    await assert.rejects(session.initialize(), /exited \(code 3\)/);
  });

  it(
    "fails at once when the server exits while a file is validated",
    { timeout: 10_000 },
    async () => {
      // A long validation timeout: only noticing the exit can finish in time.
      const { session } = startSession("crash-on-open", undefined, {
        validationTimeoutMs: 60_000,
      });

      await assert.rejects(session.initialize(), /exited \(code 4\)/);
    }
  );
});

describe("LanguageServerSession.shutdown", () => {
  it("lets the server exit cleanly", async () => {
    const { session } = startSession("ready");
    await session.initialize();

    await session.shutdown();

    assert.equal(await session.exited, 0);
  });

  it("kills a server that ignores shutdown", async () => {
    const { session } = startSession("ignores-shutdown");
    await session.initialize();

    await session.shutdown(300);

    assert.equal(await session.exited, null);
    assert.equal(isAlive(session.pid!), false);
  });
});

describe("LanguageServerSession.request", () => {
  it("passes a request through and resolves with the result", async () => {
    const { session } = startSession("ready");

    assert.deepEqual(await session.request("fake/echo", { a: 1 }), { a: 1 });
  });

  it("rejects with the server's error", async () => {
    const { session } = startSession("ready");

    await assert.rejects(
      session.request("fake/fail"),
      (error: unknown) =>
        error instanceof ResponseError &&
        error.code === -32099 &&
        error.message === "fake failure"
    );
  });
});

describe("LanguageServerSession.syncFromDisk", () => {
  async function readySession() {
    const started = startSession("ready");
    await started.session.initialize();

    const before = (await received(started.session)).length;
    const sentSince = async () =>
      (await received(started.session)).slice(before);

    return { ...started, sentSince };
  }

  it("sends only didOpen and didChange, and only when the text differs", async () => {
    const { session, dir, files, uri, sentSince } = await readySession();
    const file = files.greeter;

    assert.deepEqual(await session.syncFromDisk(file), {
      uri: uri(file),
      sent: "textDocument/didOpen",
      version: 1,
    });

    assert.deepEqual(await session.syncFromDisk(file), {
      uri: uri(file),
      sent: null,
      version: 1,
    });

    fs.writeFileSync(path.join(dir, file), "// edited\n");

    assert.deepEqual(await session.syncFromDisk(file), {
      uri: uri(file),
      sent: "textDocument/didChange",
      version: 2,
    });

    const sent = await sentSince();

    assert.deepEqual(sent, [
      {
        method: "textDocument/didOpen",
        params: {
          textDocument: {
            uri: uri(file),
            languageId: "solidity",
            version: 1,
            text: `// ${file}\n`,
          },
        },
      },
      {
        method: "textDocument/didChange",
        params: {
          textDocument: { uri: uri(file), version: 2 },
          contentChanges: [{ text: "// edited\n" }],
        },
      },
    ]);
  });

  it("follows documents opened, changed and closed through the pipe", async () => {
    const { session, files, uri, sentSince } = await readySession();
    const file = files.greeter;
    const text = `// ${file}\n`;

    await session.notify("textDocument/didOpen", {
      textDocument: {
        uri: uri(file),
        languageId: "solidity",
        version: 7,
        text,
      },
    });

    // Opened with the text on disk, so there is nothing to send.
    assert.equal((await session.syncFromDisk(file)).sent, null);

    // An incremental change leaves the text unknown, so the next sync sends
    // the whole file, with the version after the pipe's.
    await session.notify("textDocument/didChange", {
      textDocument: { uri: uri(file), version: 8 },
      contentChanges: [
        {
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 0 },
          },
          text: "x",
        },
      ],
    });

    assert.deepEqual(await session.syncFromDisk(file), {
      uri: uri(file),
      sent: "textDocument/didChange",
      version: 9,
    });

    // Once closed, it is opened afresh.
    await session.notify("textDocument/didClose", {
      textDocument: { uri: uri(file) },
    });

    assert.equal(
      (await session.syncFromDisk(file)).sent,
      "textDocument/didOpen"
    );

    assert.deepEqual(summary(await sentSince()), [
      `textDocument/didOpen ${uri(file)}`,
      `textDocument/didChange ${uri(file)}`,
      `textDocument/didChange ${uri(file)}`,
      `textDocument/didClose ${uri(file)}`,
      `textDocument/didOpen ${uri(file)}`,
    ]);
  });

  it("sends nothing for a file it cannot read", async () => {
    const { session, sentSince } = await readySession();

    assert.equal(session.canRead("contracts/Missing.sol"), false);
    assert.equal(session.canRead("contracts"), false);

    await assert.rejects(
      session.syncFromDisk("contracts/Missing.sol"),
      /Cannot read/
    );
    assert.deepEqual(await sentSince(), []);
  });
});
