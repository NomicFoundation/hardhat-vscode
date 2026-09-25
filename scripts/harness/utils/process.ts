import { spawnSync } from "node:child_process";
import path from "node:path";
import { ROOT_DIR } from "./paths.ts";

/** Run a command in `cwd`, inheriting stdio, and throw if it fails. */
export function run(command: string, args: string[], cwd: string): void {
  console.log(
    `$ (${path.relative(ROOT_DIR, cwd) || "."}) ${command} ${args.join(" ")}`
  );

  const { status, error } = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    // pnpm is a .cmd shim on Windows, which Node only runs through a shell.
    shell: process.platform === "win32",
  });

  if (error !== undefined) {
    throw error;
  }

  if (status !== 0) {
    throw new Error(`${command} exited with ${status}`);
  }
}

/** Capture a command's stdout, and throw with its stderr if it fails. */
export function capture(command: string, args: string[], cwd: string): string {
  const { status, stdout, stderr, error } = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    shell: process.platform === "win32",
  });

  if (error !== undefined) {
    throw error;
  }

  if (status !== 0) {
    throw new Error(`${command} exited with ${status}: ${stderr}`);
  }

  return stdout;
}
