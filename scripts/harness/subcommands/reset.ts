import path from "node:path";
import { ROOT_DIR } from "../utils/paths.ts";
import { capture, run } from "../utils/process.ts";
import { recordedWorkspace, runningDaemonPid } from "../utils/state.ts";
import { resolveWorkspace, type Workspace } from "../utils/workspaces.ts";

/**
 * Put one workspace back to the commit checked out, discarding edits made
 * while exploring. Gitignored files — installs, `lib/`, build output — are
 * kept, so no fresh `init` is needed afterwards.
 */
export function reset(workspaceName: string | undefined): void {
  const workspace = resetTarget(workspaceName, recordedWorkspace());

  // The daemon does not pass changes on disk through to the server, so a
  // reset under it would leave the server seeing the edited files.
  const pid = runningDaemonPid();

  if (pid !== undefined) {
    throw new Error(
      `A daemon is running (PID ${pid}). Run \`stop\` before resetting.`
    );
  }

  const relativeDir = path.relative(ROOT_DIR, workspace.dir);
  const changes = listChanges(relativeDir);

  if (changes.restored.length === 0 && changes.removed.length === 0) {
    console.log(`${workspace.name} has no changes`);

    return;
  }

  for (const file of changes.restored) {
    console.log(`restore  ${file}`);
  }

  for (const file of changes.removed) {
    console.log(`remove   ${file}`);
  }

  // Restore first, even when nothing tracked has changed: it also unstages
  // newly added files, which clean would otherwise leave alone.
  run(
    "git",
    ["restore", "--staged", "--worktree", "--", relativeDir],
    ROOT_DIR
  );

  // No -x: gitignored files are kept.
  run("git", ["clean", "-fdq", "--", relativeDir], ROOT_DIR);

  console.log(`\n${workspace.name} reset to HEAD`);
}

/**
 * The workspace to reset: the one named, else the recorded one. Never all of
 * them — with neither, it is an error.
 */
export function resetTarget(
  workspaceName: string | undefined,
  recorded: Workspace | undefined
): Workspace {
  if (workspaceName !== undefined) {
    return resolveWorkspace(workspaceName);
  }

  if (recorded !== undefined) {
    return recorded;
  }

  throw new Error(
    "No workspace recorded. Pass --workspace <name>, or run `start --workspace <name>` first."
  );
}

interface Changes {
  /** Tracked files that differ from HEAD, in the index or the working tree. */
  restored: string[];
  /** Files not in HEAD: untracked but not ignored, or newly staged. */
  removed: string[];
}

function listChanges(relativeDir: string): Changes {
  const output = capture(
    "git",
    ["status", "--porcelain=v1", "--untracked-files=all", "--", relativeDir],
    ROOT_DIR
  );

  return parseStatus(output);
}

export function parseStatus(output: string): Changes {
  const changes: Changes = { restored: [], removed: [] };

  for (const line of output.split("\n")) {
    if (line === "") {
      continue;
    }

    const status = line.slice(0, 2);
    const file = line.slice(3);

    if (status === "??" || status[0] === "A") {
      changes.removed.push(file);
    } else {
      changes.restored.push(file);
    }
  }

  return changes;
}
