import assert from "node:assert/strict";
import { type ChildProcess, spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, it } from "node:test";
import { isAlive, stopDaemon } from "./daemon.ts";
import { readDaemonState, writeDaemonPid, writeDaemonState } from "./state.ts";

const children: ChildProcess[] = [];

afterEach(() => {
  for (const child of children.splice(0)) {
    child.kill("SIGKILL");
  }
});

/** A stand-in daemon: a process that runs until signalled, or ignores it. */
async function fakeDaemon(ignoreSigterm = false): Promise<number> {
  const script = ignoreSigterm
    ? "process.on('SIGTERM', () => {}); console.log('up'); setInterval(() => {}, 1000)"
    : "console.log('up'); setInterval(() => {}, 1000)";

  const child = spawn(process.execPath, ["-e", script], {
    stdio: ["ignore", "pipe", "ignore"],
  });
  children.push(child);

  // Wait until it runs, so its SIGTERM handler is installed.
  await new Promise((resolve) => child.stdout!.once("data", resolve));

  return child.pid!;
}

function harnessDirWith(pid: number): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "harness-daemon-"));

  writeDaemonPid(pid, dir);
  writeDaemonState(
    { pid, workspace: "foundry", port: 1, startedAt: "", ready: true },
    dir
  );

  return dir;
}

describe("stopDaemon", () => {
  it("stops a running daemon with SIGTERM and clears its files", async () => {
    const pid = await fakeDaemon();
    const dir = harnessDirWith(pid);

    assert.equal(await stopDaemon(dir), pid);
    assert.equal(isAlive(pid), false);
    assert.equal(readDaemonState(dir), undefined);
    assert.equal(fs.existsSync(path.join(dir, "daemon.pid")), false);
  });

  it("kills a daemon that ignores SIGTERM", async () => {
    const pid = await fakeDaemon(true);
    const dir = harnessDirWith(pid);

    assert.equal(await stopDaemon(dir, 300), pid);
    assert.equal(isAlive(pid), false);
  });

  it("clears the files of a daemon that has died, and stops nothing", async () => {
    const pid = await fakeDaemon();
    process.kill(pid, "SIGKILL");
    await new Promise((resolve) => setTimeout(resolve, 200));
    const dir = harnessDirWith(pid);

    assert.equal(await stopDaemon(dir), undefined);
    assert.equal(readDaemonState(dir), undefined);
  });

  it("keeps the current workspace", async () => {
    const pid = await fakeDaemon();
    const dir = harnessDirWith(pid);
    fs.writeFileSync(path.join(dir, "workspace"), "foundry\n");

    await stopDaemon(dir);

    assert.equal(
      fs.readFileSync(path.join(dir, "workspace"), "utf8"),
      "foundry\n"
    );
  });
});
