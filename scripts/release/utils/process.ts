import { spawnSync } from "node:child_process";
import type { SpawnSyncOptions } from "node:child_process";

interface RunOptions extends SpawnSyncOptions {
  /** Values to redact from the echoed command line, such as a token. */
  secrets?: string[];
}

/** Run a command, inheriting stdio, and throw if it fails. */
export function run(
  command: string,
  args: string[],
  { secrets = [], ...options }: RunOptions = {}
): void {
  const shown = args.map((arg) => (secrets.includes(arg) ? "***" : arg));
  console.log(`$ ${command} ${shown.join(" ")}`);

  const { status, error } = spawnSync(command, args, {
    stdio: "inherit",
    ...options,
  });

  if (error !== undefined) {
    throw error;
  }

  if (status !== 0) {
    throw new Error(`${command} exited with ${status}`);
  }
}

/**
 * Run a command whose non-zero exit is information rather than failure, such
 * as `git diff --no-index` reporting that two things differ.
 */
export function runTolerant(command: string, args: string[]): void {
  console.log(`$ ${command} ${args.join(" ")}`);

  const { error } = spawnSync(command, args, { stdio: "inherit" });

  if (error !== undefined) {
    throw error;
  }
}

/**
 * Capture a command's stdout, trimmed, and throw if it fails.
 */
export function capture(command: string, args: string[]): string {
  const { status, stdout, stderr } = spawnSync(command, args, {
    encoding: "utf8",
  });

  if (status !== 0) {
    throw new Error(`${command} exited with ${status}: ${stderr}`);
  }

  return stdout.trim();
}

export function prefixDryRun(description: string, command?: string[]): void {
  console.log(`  [dry run] ${description}`);

  if (command !== undefined) {
    console.log(`  [dry run]   would run: ${command.join(" ")}`);
  }
}

/** An environment variable a step cannot run without. */
export function readRequiredEnvVariable(name: string): string {
  const value = process.env[name];

  if (value === undefined || value === "") {
    throw new Error(`${name} is not set`);
  }

  return value;
}
