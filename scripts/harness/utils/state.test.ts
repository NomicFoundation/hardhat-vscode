import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import {
  recordWorkspace,
  recordedWorkspace,
  requireRecordedWorkspace,
  runningDaemonPid,
} from "./state.ts";
import { resolveWorkspace } from "./workspaces.ts";

function tmpHarnessDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "harness-state-"));
}

describe("recorded workspace", () => {
  it("round-trips through the workspace file", () => {
    const dir = tmpHarnessDir();

    recordWorkspace(resolveWorkspace("hardhat2"), dir);

    assert.deepEqual(recordedWorkspace(dir), resolveWorkspace("hardhat2"));
  });

  it("creates the harness directory if it is missing", () => {
    const dir = path.join(tmpHarnessDir(), ".harness");

    recordWorkspace(resolveWorkspace("foundry"), dir);

    assert.equal(recordedWorkspace(dir)?.name, "foundry");
  });

  it("is undefined when nothing is recorded", () => {
    assert.equal(recordedWorkspace(tmpHarnessDir()), undefined);
  });

  it("says how to record one when it is required", () => {
    assert.throws(
      () => requireRecordedWorkspace(tmpHarnessDir()),
      /start --workspace <name>/
    );
  });

  it("rejects a recorded name that is not a workspace", () => {
    const dir = tmpHarnessDir();
    fs.writeFileSync(path.join(dir, "workspace"), "truffle\n");

    assert.throws(() => recordedWorkspace(dir), /Unknown workspace: truffle/);
  });
});

describe("runningDaemonPid", () => {
  it("is undefined without a PID file", () => {
    assert.equal(runningDaemonPid(tmpHarnessDir()), undefined);
  });

  it("returns the PID of a live process", () => {
    const dir = tmpHarnessDir();
    fs.writeFileSync(path.join(dir, "daemon.pid"), `${process.pid}\n`);

    assert.equal(runningDaemonPid(dir), process.pid);
  });

  it("treats the PID of an exited process as stale", () => {
    const dir = tmpHarnessDir();
    const { pid } = spawnSync(process.execPath, ["-e", ""]);
    fs.writeFileSync(path.join(dir, "daemon.pid"), `${pid}\n`);

    assert.equal(runningDaemonPid(dir), undefined);
  });

  it("treats an unreadable PID as no daemon", () => {
    const dir = tmpHarnessDir();
    fs.writeFileSync(path.join(dir, "daemon.pid"), "not a pid\n");

    assert.equal(runningDaemonPid(dir), undefined);
  });
});
