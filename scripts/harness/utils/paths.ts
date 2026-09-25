import path from "node:path";

/** Resolved from this file, so the harness works from any cwd. */
export const ROOT_DIR = path.resolve(import.meta.dirname, "..", "..", "..");

export const EXAMPLE_WORKSPACES_DIR = path.join(ROOT_DIR, "example-workspaces");
